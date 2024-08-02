"use client";
import { advanceInput, getNotice, getNotices } from "@mugen-builders/client";
import { ethers } from "ethers";
import Head from "next/head";
import { useEffect, useState } from "react";
import injectedModule from "@web3-onboard/injected-wallets";
import { init, useSetChain, useWallets } from "@web3-onboard/react";
import { v4 as uuidv4 } from "uuid";
type FormType = {
  name: string;
  age: string;
  dob: string;
  uid: string;
  file: any;
};
import configFile from "./config.json";
import { InspectCall } from "./exports";
import { Network } from "./components/network";
import { hexToString } from "viem";
import { constants } from "vm";
import imageCompression from "browser-image-compression";
const config: any = configFile;
const injected = injectedModule();

init({
  wallets: [injected],
  chains: Object.entries(config).map(([k, v]: [string, any], i) => ({
    id: k,
    token: v.token,
    label: v.label,
    rpcUrl: v.rpcUrl,
  })),
  appMetadata: {
    name: "D OCR",
    icon: "<svg>CarteSign<svg/>",
    description: "Cartesi Dapp decentralized document scanning feature",
    recommendedInjectedWallets: [
      { name: "MetaMask", url: "https://metamask.io" },
    ],
  },
});

export default function Home() {
  const [formData, setFormData] = useState<FormType>({
    name: "",
    age: "",
    dob: "",
    uid: "",
    file: "",
  });
  const [dappAddress, setDappAddress] = useState<string>(
    process.env.NEXT_PUBLIC_DAPP_ARB_SEPOLIA_ADDRESS
      ? process.env.NEXT_PUBLIC_DAPP_ARB_SEPOLIA_ADDRESS
      : "0xab7528bb862fb57e8a2bcd567a2e929a0be56a5e"
  );
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
  const [connectedWallet] = useWallets();
  const [notices, setNotices] = useState<any>([]);
  let apiURL = "http://localhost:8080/graphql";
  const [response, setResponse] = useState(undefined);
  if (connectedChain) {
    if (config[connectedChain.id]?.graphqlAPIURL) {
      apiURL = `${config[connectedChain.id].graphqlAPIURL}/graphql`;
    } else {
      console.error(
        `No inspect interface defined for chain ${connectedChain.id}`
      );
      return;
    }
  }

  const getAllNotices = async () => {
    console.log("getting notices");
    let Notices: any = await getNotices(apiURL);
    setNotices(Notices);
    console.log(Notices);
    Notices = Notices.map((n: any) => {
      let inputPayload = n?.input.payload;
      if (inputPayload) {
        try {
          inputPayload = ethers.utils.toUtf8String(inputPayload);
        } catch (e) {
          inputPayload = inputPayload + " (hex)";
        }
      } else {
        inputPayload = "(empty)";
      }
      let payload = n?.payload;
      if (payload) {
        try {
          payload = ethers.utils.toUtf8String(payload);
        } catch (e) {
          payload = payload + " (hex)";
        }
      } else {
        payload = "(empty)";
      }
      return {
        id: `${n?.id}`,
        index: parseInt(n?.index),
        payload: `${payload}`,
        input: n ? { index: n.input.index, payload: inputPayload } : {},
      };
    }).sort((b: any, a: any) => {
      if (a.input.index === b.input.index) {
        return b.index - a.index;
      } else {
        return b.input.index - a.input.index;
      }
    });
    setNotices(Notices);
    console.log("the notices are:", Notices);
    const result = JSON.parse(
      Notices[Notices.length > 0 ? Notices.length - 1 : 0].payload
    );
    console.log("result is", result.id, result.result);
    setResponse(result.result);
  };

  const handleChange = async (e: any) => {
    let { name, value, files } = e.target;
    console.log(name, value, files);
    const options = {
      maxSizeKB: 200,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    if (name == "file") {
      let reader = new FileReader();
      try {
        const compressedFile = await imageCompression(files[0], options);
        console.log(
          "compressedFile instanceof Blob",
          compressedFile instanceof Blob
        ); // true
        console.log(
          `compressedFile size ${compressedFile.size / 1024 / 1024} MB`
        ); // smaller than maxSizeMB

        reader.readAsDataURL(compressedFile);
        reader.onload = function () {
          const _value = JSON.stringify(
            reader.result?.toString().split(",")[1]
          );
          setFormData({
            ...formData,
            [name]: _value,
          });
          console.log(String(_value));

          return;
        };
      } catch (error) {
        console.log(error);
      }
      reader.onerror = function (error) {
        console.log("Error: ", error);
      };
    }
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleUIDChange = (e: any) => {
    const value = e.target.value
      .replace(/\D/g, "")
      .replace(/(\d{4})(?=\d)/g, "$1 ");
    setFormData({ ...formData, uid: value });
  };
  const convertFileToBase64 = (file: any) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const { name, age, dob, uid, file } = formData;

    if (!file) {
      alert("Please fill out all fields.");
      return;
    }
    console.log(formData);
    const input = JSON.stringify({ id: uuidv4(), data: formData.file });
    console.log(input);
    const result = await addCustomInput(input);
    console.log(result);
    setTimeout(async () => {
      console.log("getting notices");
      await getAllNotices();
    }, 10000);
  };
  const addCustomInput = async (input: any): Promise<any> => {
    const provider = new ethers.providers.Web3Provider(
      connectedWallet.provider
    );
    if (!connectedWallet) {
      alert(`please connect your wallet`);
      return;
    }
    console.log("adding input");
    const signer = await provider.getSigner();
    console.log(signer);
    await advanceInput(signer, dappAddress, input);
  };

  return (
    <div className="min-h-screen  bg-gradient-to-r flex flex-col text-slate-900 from-purple-300 via-pink-400 to-red-300  dark:from-purple-700 dark:via-pink-700 dark:to-red-700">
      <div className="flex items-center justify-center flex-col">
        <Head>
          <title className="text-6xl text-slate-800">D OCR </title>
        </Head>
        <div className="flex flex-col justify-center px-2">
          <h1 className="text-4xl text-center text-slate-800">D OCR </h1>

          <Network />
          <div className="absolute mt-5 top-4 left-4 w-40 h-40 bg-gray-300 rounded-full">
            {" "}
            <img
              className=" rounded-full "
              src="https://jjhbk.github.io/assets/images/docr.png"
            />
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-start mb-6">
              <div className="w-16 h-16 bg-gray-300 rounded-full">
                {" "}
                <img
                  className=" rounded-full "
                  src="https://jjhbk.github.io/assets/images/docr.png"
                />
              </div>
            </div>
            <h1 className="text-2xl text-slate-700 font-bold mb-4 text-center">
              D OCR
            </h1>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="file"
                >
                  Upload File
                </label>
                <input
                  type="file"
                  id="file"
                  name="file"
                  onChange={handleChange}
                  className="shadow  h-full appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {response && (
        <div className="flex flex-col justify-center items-center">
          <h1 className="flex text-center mt-10 text-2xl">Scanned Result</h1>
          <div className="bg-slate-200 mt-6 mx-32 h-80 overflow-y-scroll border-slate-400 p-4 rounded-lg">
            <p className="text-black mx-5 whitespace-break-spaces">
              {response}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
