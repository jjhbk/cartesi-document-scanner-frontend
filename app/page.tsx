"use client";
import { advanceInput, getNotice, getNotices } from "@mugen-builders/client";
import { ethers } from "ethers";
import Head from "next/head";
import { useState } from "react";
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
    name: "Cartesi-Privado Verifier",
    icon: "<svg>CarteSign<svg/>",
    description: "Cartesi Dapp with PrivadoID Verification",
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
    process.env.NEXT_PUBLIC_DAPP_AMOY_ADDRESS
      ? process.env.NEXT_PUBLIC_DAPP_AMOY_ADDRESS
      : "0xab7528bb862fb57e8a2bcd567a2e929a0be56a5e"
  );
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
  const [notices, setNotices] = useState<any>([]);
  let apiURL = "http://localhost:8080/graphql";
  const [response, setResponse] = useState("");
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
  };

  const handleChange = (e: any) => {
    let { name, value, files } = e.target;
    console.log(name, value, files);

    if (name == "file") {
      let reader = new FileReader();
      reader.readAsDataURL(files[0]);
      reader.onload = function () {
        //me.modelvalue = reader.result;
        const _value = JSON.stringify(reader.result?.toString().split(",")[1]);
        setFormData({
          ...formData,
          [name]: _value,
        });
        console.log(String(_value));

        return;
      };
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

    if (!name || !age || !dob || !uid || !file) {
      alert("Please fill out all fields.");
      return;
    }
    console.log(formData);
    const input = JSON.stringify({ id: uuidv4(), data: formData.file });
    console.log(input);
    const result = await addCustomInput(input);
    console.log(result);
    setTimeout(async () => {
      await getAllNotices();
    }, 10000);
  };
  const [connectedWallet] = useWallets();
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
    <div className="min-h-screen bg-gradient-to-br from-pink-400 to-pink-200 flex flex-col items-center justify-center">
      <div className="absolute top-0 left-0 m-4">
        <img src="/logo.png" alt="Logo" className="h-16 w-16" />
      </div>
      <div className="flex flex-col items-center">
        <label
          htmlFor="file-upload"
          className="h-72 w-72 rounded-full border-4 border-dashed border-white flex items-center justify-center text-white cursor-pointer mb-4"
        >
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleChange}
          />
          {formData.file ? formData.file : "Upload Image"}
        </label>
        <button
          onClick={handleSubmit}
          className="bg-white text-gray-800 py-2 px-4 rounded-full shadow-md"
        >
          Send to API
        </button>
      </div>
      {response && <div className="mt-4 text-white">{response}</div>}
    </div>
  );
}
