import {Connection, Keypair, PublicKey,} from "@solana/web3.js";
import {APIGatewayProxyEventV2, APIGatewayProxyResultV2} from "aws-lambda";
import {Account, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID, transferChecked,} from "@solana/spl-token";

interface DepositInput {
  customerPrivateKey: string;
  nftKey: string;
}

interface TxResult {
  customerPrivateKey?: string;
  customerPublicKey?: string;
  nftKey: string;
  txHash?: string;
  state?: boolean;
  error?: string;
}

interface Keys {
  customerAccount: Keypair;
  operatorAccount: Keypair;
  nftKey: PublicKey;
  fromTokenAccount: Account;
  toTokenAccount: Account;
}

const NET_URL: string = process.env.NET_URL ?? ""
const LINGER_WALLET_PUBLICKEY: string  = process.env.LINGER_WALLET_PUBLICKEY ?? "";

const CONNECTION = new Connection(
  NET_URL,
  "confirmed"
);

const publicKey = new PublicKey(LINGER_WALLET_PUBLICKEY);

async function dispatchKeys(item: TxResult, operatorPrivateKey: string) {
  item.state = true;

  let customerAccount;
  let operatorAccount;
  let nftKey;
  let fromTokenAccount: Account;
  let toTokenAccount: Account;
  try {
    customerAccount = Keypair.fromSecretKey(
      Uint8Array.from(Buffer.from(item.customerPrivateKey || "", "base64"))
    );
    operatorAccount = Keypair.fromSecretKey(
      Uint8Array.from(Buffer.from(operatorPrivateKey, "base64"))
    );
    nftKey = new PublicKey(item.nftKey);
    fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      CONNECTION,
      operatorAccount,
      nftKey,
      customerAccount.publicKey
    );

    toTokenAccount = await getOrCreateAssociatedTokenAccount(
      CONNECTION,
      operatorAccount,
      nftKey,
      publicKey
    );
    item.customerPublicKey = customerAccount.publicKey.toString();
  } catch (err) {
    throw new Error(`${err}`);
  }

  return {
    customerAccount,
    operatorAccount,
    nftKey,
    fromTokenAccount,
    toTokenAccount,
  };
}

async function dispatchTransaction(item: TxResult, keys: Keys) {
  const txHash = await transferChecked(
    CONNECTION,
    keys.operatorAccount,
    keys.fromTokenAccount.address,
    keys.nftKey,
    keys.toTokenAccount.address,
    keys.customerAccount,
    1,
    0,
    [keys.operatorAccount],
    { commitment: "finalized", skipPreflight: true },
    TOKEN_PROGRAM_ID
  ).catch((err) => {
    item.error = `${err}`;
    item.state = false;
  });
  item.txHash = txHash || "";
  console.log(txHash);
}

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body ?? "");
  const depositInfo: DepositInput = body.depositInfo;
  const OPERATOR_ACCOUNT_PRIVATEKEY: string | undefined =
    process.env.OPERATOR_ACCOUNT;

  if (depositInfo === undefined) {
    return {
      statusCode: 403,
    };
  }

  if (
    OPERATOR_ACCOUNT_PRIVATEKEY === undefined ||
    LINGER_WALLET_PUBLICKEY === undefined
  ) {
    return {
      statusCode: 503,
    };
  }

  let response: TxResult = {
    customerPrivateKey: depositInfo.customerPrivateKey,
    nftKey: depositInfo.nftKey,
  };

  await dispatchKeys(response, OPERATOR_ACCOUNT_PRIVATEKEY)
    .then(async (res) => {
      await dispatchTransaction(response, res);
    })
    .catch((err) => {
      response.state = false;
      response.error = err;
    });

  delete response.customerPrivateKey;
  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
}
