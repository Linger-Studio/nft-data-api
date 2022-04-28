import { Keypair, PublicKey, Signer } from "@solana/web3.js";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

interface DepositInput {
  customerPrivateKey: number[];
  nftKey: string;
}

interface TxResult {
  txHash: string;
  state: boolean;
  error?: string;
}

export async function deposit(
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

  if (OPERATOR_ACCOUNT_PRIVATEKEY === undefined) {
    return {
      statusCode: 503,
    };
  }

  try {
    const customerAccount: Signer = Keypair.fromSecretKey(
      Uint8Array.from(depositInfo.customerPrivateKey)
    );

    const operatorAccount: Signer = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(OPERATOR_ACCOUNT_PRIVATEKEY))
    );

    const nftKey: PublicKey = new PublicKey(depositInfo.nftKey);
  } catch {
    return {
      statusCode: 403,
    };
  } finally {
    return {
      statusCode: 200,
      body: JSON.stringify(""),
    };
  }
}
