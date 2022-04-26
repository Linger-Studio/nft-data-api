import express, { Request, Response, NextFunction } from "express";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import axios, { AxiosResponse, AxiosPromise } from "axios";

const app = express();
const connection = new Connection("https://api.mainnet-beta.solana.com");
const metadataProgramId = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

app.use(express.json());

app.post(
  "/metadatas",
  async (req: Request, res: Response, next: NextFunction) => {
    req.accepts("application/json");
    let metadatas: {
      nftKey: String;
      isValidKey: boolean;
      metadata?: any;
      state?: boolean;
    }[] = [];
    let metadataKeys: string[];
    let nftKeys: string[];

    if (!req.body.hasOwnProperty("keys") || !Array.isArray(req.body.keys)) {
      res.status(400).json({ error: "invalid input" });
      return 1;
    }
    nftKeys = req.body.keys;
    metadataKeys = await Promise.all(
      nftKeys.map(async (v: string) => {
        let metadataKey: PublicKey;
        try {
          metadataKey = (
            await PublicKey.findProgramAddress(
              [
                Buffer.from("metadata", "utf-8"),
                metadataProgramId.toBuffer(),
                new PublicKey(v).toBuffer(),
              ],
              metadataProgramId
            )
          )[0];

          return metadataKey.toString();
        } catch (err) {
          metadataKey = SystemProgram.programId;

          return metadataKey.toString();
        }
      })
    );

    metadatas = metadataKeys.map((v, i) => {
      if (v === SystemProgram.programId.toString()) {
        return { nftKey: nftKeys[i], isValidKey: false };
      } else {
        return { nftKey: nftKeys[i], isValidKey: true };
      }
    });

    let jsonRpcRequestData = {
      jsonrpc: "2.0",
      id: 1,
      method: "getMultipleAccounts",
      params: [metadataKeys, {}],
    };

    let rpcResponse: AxiosResponse<any, any> | null = null;

    try {
      rpcResponse = await axios({
        method: "POST",
        url: "https://solana-api.projectserum.com",
        headers: { "Content-Type": "application/json" },
        data: jsonRpcRequestData,
      });
    } catch (err) {
      res.status(500).json({ error: ` Solana RPC Endpoint ERROR: ${err}` });
    }

    if (rpcResponse) {
      let metadataUris = rpcResponse.data.result.value.map(
        (v: any, i: number) => {
          let onchainMetadata: [Metadata, number];
          try {
            onchainMetadata = Metadata.deserialize(
              Buffer.from(v.data[0], "base64")
            );

            return onchainMetadata[0].data.uri;
          } catch {
            metadatas[i].isValidKey = false;
            metadatas[i].metadata = null;
            metadatas[i].state = false;
            return null;
          }
        }
      );

      let offchainMetadatas = await Promise.all(
        metadataUris.map((v: any, i: number) => {
          let metadataResponse = null;
          if (v !== null) {
            try {
              metadataResponse = axios({
                method: "get",
                url: v,
              });
            } catch {
              metadatas[i].metadata = null;
              metadatas[i].state = false;
            }
          }
          return metadataResponse;
        })
      );

      offchainMetadatas.forEach((v, i) => {
        if (v !== null) {
          metadatas[i].metadata = v.data;
          metadatas[i].state = true;
        }
      });

      res.status(200).json(metadatas);
      return;
    } else {
      res.status(500).json({ error: ` Solana RPC Endpoint response is null` });
      return 1;
    }
  }
);

app.post("/images", async (req: Request, res: Response, next: NextFunction) => {
  req.accepts("application/json");
  let metadatas: {
    nftKey: String;
    isValidKey: boolean;
    metadata?: any;
    state?: boolean;
  }[] = [];
  let metadataKeys: string[];
  let nftKeys: string[];

  if (!req.body.hasOwnProperty("keys") || !Array.isArray(req.body.keys)) {
    res.status(400).json({ error: "invalid input" });
    return 1;
  }
  nftKeys = req.body.keys;
  metadataKeys = await Promise.all(
    nftKeys.map(async (v: string) => {
      let metadataKey: PublicKey;
      try {
        metadataKey = (
          await PublicKey.findProgramAddress(
            [
              Buffer.from("metadata", "utf-8"),
              metadataProgramId.toBuffer(),
              new PublicKey(v).toBuffer(),
            ],
            metadataProgramId
          )
        )[0];

        return metadataKey.toString();
      } catch (err) {
        metadataKey = SystemProgram.programId;

        return metadataKey.toString();
      }
    })
  );

  metadatas = metadataKeys.map((v, i) => {
    if (v === SystemProgram.programId.toString()) {
      return { nftKey: nftKeys[i], isValidKey: false };
    } else {
      return { nftKey: nftKeys[i], isValidKey: true };
    }
  });

  let jsonRpcRequestData = {
    jsonrpc: "2.0",
    id: 1,
    method: "getMultipleAccounts",
    params: [metadataKeys, {}],
  };

  let rpcResponse: AxiosResponse<any, any> | null = null;

  try {
    rpcResponse = await axios({
      method: "POST",
      url: "https://solana-api.projectserum.com",
      headers: { "Content-Type": "application/json" },
      data: jsonRpcRequestData,
    });
  } catch (err) {
    res.status(500).json({ error: ` Solana RPC Endpoint ERROR: ${err}` });
  }

  if (rpcResponse) {
    let metadataUris = rpcResponse.data.result.value.map(
      (v: any, i: number) => {
        let onchainMetadata: [Metadata, number];
        try {
          onchainMetadata = Metadata.deserialize(
            Buffer.from(v.data[0], "base64")
          );

          return onchainMetadata[0].data.uri;
        } catch {
          metadatas[i].isValidKey = false;
          metadatas[i].metadata = null;
          metadatas[i].state = false;
          return null;
        }
      }
    );

    let offchainMetadatas = await Promise.all(
      metadataUris.map((v: any, i: number) => {
        let metadataResponse = null;
        if (v !== null) {
          try {
            metadataResponse = axios({
              method: "get",
              url: v,
            });
          } catch {
            metadatas[i].metadata = null;
            metadatas[i].state = false;
          }
        }
        return metadataResponse;
      })
    );

    offchainMetadatas.forEach((v, i) => {
      if (v !== null) {
        metadatas[i].metadata = v.data.image;
        metadatas[i].state = true;
      }
    });

    res.status(200).json(metadatas);
    return;
  } else {
    res.status(500).json({ error: ` Solana RPC Endpoint response is null` });
    return 1;
  }
});

app.listen("3000", () => {
  console.log(`Server listening on port: 3000`);
});
