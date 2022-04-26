import {Metadata} from "@metaplex-foundation/mpl-token-metadata";
import {PublicKey, SystemProgram} from "@solana/web3.js";
import fetch from "node-fetch";
import {APIGatewayProxyEventV2, APIGatewayProxyResultV2} from 'aws-lambda';

interface NftMetadata {
    nftKey: string;
    isValidKey: boolean;
    address?: string;
    metadata?: any;
    metadataUri?: string;
    state?: boolean;
}

const metadataProgramId = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

async function dispatchAddress(list: NftMetadata[]) {
    await Promise.all(
        list.map(async item => {
            const address = await PublicKey.findProgramAddress(
                [
                    Buffer.from("metadata", "utf-8"),
                    metadataProgramId.toBuffer(),
                    new PublicKey(item.nftKey).toBuffer(),
                ],
                metadataProgramId
            ).then(item => item[0].toString())

            item.address = address
            item.isValidKey = address !== SystemProgram.programId.toString()
        })
    )
}

async function dispatchMetadataUri(list: NftMetadata[]) {
    const validList = list.filter(item => item.isValidKey)
    const addresses = validList.map(item => item.address)

    const requestBody = {
        jsonrpc: "2.0",
        id: 1,
        method: "getMultipleAccounts",
        params: [addresses, {}],
    };

    const response = await fetch('https://httpbin.org/post', {
        method: 'post',
        body: JSON.stringify(requestBody),
        headers: {'Content-Type': 'application/json'}
    });

    const rpcResponse = await response.json();

    if (rpcResponse) {
        rpcResponse.data.result.value.map(
            (v: any, i: number) => {
                let onchainMetadata: [Metadata, number];
                try {
                    onchainMetadata = Metadata.deserialize(
                        Buffer.from(v.data[0], "base64")
                    );

                    validList[i].metadataUri = onchainMetadata[0].data.uri
                } catch {
                    validList[i].isValidKey = false;
                    validList[i].metadata = null;
                    validList[i].state = false;
                }
            }
        );
    }
}

async function dispatchMetadata(list: NftMetadata[]) {
    await Promise.all(list.map(async item => {
        if (item.isValidKey && item.metadataUri) {
            try {
                const url = item.metadataUri ?? ""
                item.metadata = await fetch(url).then(res => res.json())
                item.state = true
            } catch {
                item.metadata = null
                item.state = false
            }
        }
    }));
}

export async function metadata(
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
    const body = JSON.parse(event.body ?? "")
    const nftKeys: string[] = body.keys;

    if (nftKeys == undefined) {
        return {
            statusCode: 403
        }
    }

    const response: NftMetadata[] = nftKeys.map(key => ({nftKey: key, isValidKey: false}))

    await dispatchAddress(response)
        .then(() => dispatchMetadataUri(response))
        .catch(() => {
            return {
                statusCode: 500,
                message: "Solana RPC Endpoint response is null"
            }
        })
        .then(() => dispatchMetadata(response))

    return {
        statusCode: 200,
        body: JSON.stringify(response.map(item => ({
            nft_key: item.nftKey,
            metadata: item.metadata,
            is_valid_key: item.isValidKey,
            state: item.state
        })))
    }
}