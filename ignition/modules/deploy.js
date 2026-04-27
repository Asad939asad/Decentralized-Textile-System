import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { getAddress } from "ethers";

export default buildModule("TextileModule", (m) => {
  // 1. Deploy the TextileLogic library first
  const textileLogic = m.library("TextileLogic");

  // 2. Hardhat default accounts — normalized to exact EIP-55 checksum via ethers.getAddress
  const council = [
    getAddress("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"),
    getAddress("0x70997970c51812dc3a010c7d01b50e0d17dc79c8"),
    getAddress("0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc"),
  ];
  const threshold = 2;

  // 3. Deploy the main contract, linking the library
  const textileContract = m.contract("TextileNexusPro", [council, threshold], {
    libraries: {
      TextileLogic: textileLogic,
    },
  });

  return { textileLogic, textileContract };
});