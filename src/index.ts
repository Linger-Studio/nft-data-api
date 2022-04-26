import express, { Request, Response, NextFunction } from "express";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { Connection, PublicKey } from "@solana/web3.js";
import axios from "axios";

const app = express();
const connection = new Connection("https://api.mainnet-beta.solana.com");
const metadataProgramId = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

app.use(express.text());
app.use(express.json());

app.post(
  "/metadata",
  async (req: Request, res: Response, next: NextFunction) => {
    const metadataKey = (
      await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata", "utf-8"),
          metadataProgramId.toBuffer(),
          new PublicKey(req.body).toBuffer(),
        ],
        metadataProgramId
      )
    )[0];
    let metadata = await Metadata.fromAccountAddress(connection, metadataKey);
    let metadataRes = await axios({
      method: "get",
      url: metadata.data.uri,
    });
    res.send(metadataRes.data);
  }
);

app.post("/image", async (req: Request, res: Response, next: NextFunction) => {
  const metadataKey = (
    await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata", "utf-8"),
        metadataProgramId.toBuffer(),
        new PublicKey(req.body).toBuffer(),
      ],
      metadataProgramId
    )
  )[0];
  let metadata = await Metadata.fromAccountAddress(connection, metadataKey);
  let metadataRes = await axios({
    method: "get",
    url: metadata.data.uri,
  });
  res.send(metadataRes.data.image);
});

app.post(
  "/metadatas",
  async (req: Request, res: Response, next: NextFunction) => {
    let metadataKeys: any = [];
    let nftKeys = req.body.keys;

    console.log(nftKeys);

    metadataKeys = await Promise.all(
      nftKeys.map(async (v: any) => {
        let metadataKey = (
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
      })
    );

    console.log(metadataKeys);

    let jsonRpcRequestData = {
      jsonrpc: "2.0",
      id: 1,
      method: "getMultipleAccounts",
      params: [metadataKeys, {}],
    };

    let rpcResponse = await axios({
      method: "POST",
      url: "https://solana-api.projectserum.com",
      headers: { "Content-Type": "application/json" },
      data: jsonRpcRequestData,
    });

    let metadataResponses = await Promise.all(
      rpcResponse.data.result.value.map((v: any) => {
        let metadata = Metadata.deserialize(Buffer.from(v.data[0], "base64"));
        let metadataRes = axios({
          method: "get",
          url: metadata[0].data.uri,
        });
        return metadataRes;
      })
    );

    let metadatas = metadataResponses.map((v) => v.data);

    res.send(JSON.stringify(metadatas));
  }
);

app.post("/images", async (req: Request, res: Response, next: NextFunction) => {
  let metadataKeys: any = [];
  let nftKeys = req.body.keys;

  console.log(nftKeys);

  metadataKeys = await Promise.all(
    nftKeys.map(async (v: any) => {
      let metadataKey = (
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
    })
  );

  console.log(metadataKeys);

  let jsonRpcRequestData = {
    jsonrpc: "2.0",
    id: 1,
    method: "getMultipleAccounts",
    params: [metadataKeys, {}],
  };

  let rpcResponse = await axios({
    method: "POST",
    url: "https://solana-api.projectserum.com",
    headers: { "Content-Type": "application/json" },
    data: jsonRpcRequestData,
  });

  let metadataResponses = await Promise.all(
    rpcResponse.data.result.value.map((v: any) => {
      let metadata = Metadata.deserialize(Buffer.from(v.data[0], "base64"));
      let metadataRes = axios({
        method: "get",
        url: metadata[0].data.uri,
      });
      return metadataRes;
    })
  );

  let metadatas = metadataResponses.map((v) => v.data.image);

  res.send(JSON.stringify(metadatas));
});

app.listen("3000", () => {
  console.log(`Server listening on port: 3000`);
});
