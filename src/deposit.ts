import { PublicKey } from "@solana/web3.js";
import fetch from "node-fetch";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

export async function metadata(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body ?? "");
  return {
    statusCode: 200,
    body: JSON.stringify(""),
  };
}
