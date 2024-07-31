import { hexToString, parseAbi } from "viem";
import configFile from "./config.json";
const config: any = configFile;
export const InspectCall = async (
  path: string,
  chainid: string
): Promise<any> => {
  try {
    let apiURL = "http://127.0.0.1:8080/inspect";
    let payload;
    if (config[chainid]?.inspectAPIURL) {
      apiURL = `${config[chainid].inspectAPIURL}/inspect`;
    } else {
      console.error(`No inspect interface defined for chain ${chainid}`);
      return new Error(`No inspect interface defined for chain ${chainid}`);
    }
    console.log(`${apiURL}/${path}`);
    await fetch(`${apiURL}/${path}`, {
      method: "get",
      headers: new Headers({
        "ngrok-skip-browser-warning": "9999",
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("inspect result is:", data);
        payload = hexToString(data.reports[0]?.payload);
      });
    return payload;
  } catch (e) {
    console.log("error", e);
  }
};
