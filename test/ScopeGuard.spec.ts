import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { AddressZero } from "@ethersproject/constants";

describe("ScopeGuard", async () => {
  const [user1, user2] = waffle.provider.getWallets();
  const abiCoder = new ethers.utils.AbiCoder();
  const initializeParams = abiCoder.encode(["address"], [user1.address]);

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture();
    const avatarFactory = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await avatarFactory.deploy();
    const guardFactory = await hre.ethers.getContractFactory("ScopeGuard");
    const guard = await guardFactory.deploy(user1.address);
    await avatar.enableModule(user1.address);
    await avatar.setGuard(guard.address);
    const tx = {
      to: avatar.address,
      value: 0,
      data: "0x",
      operation: 0,
      avatarTxGas: 0,
      baseGas: 0,
      gasPrice: 0,
      gasToken: AddressZero,
      refundReceiver: AddressZero,
      signatures: "0x",
    };
    return {
      avatar,
      guard,
      tx,
    };
  });

  describe("checkTransaction() with parameter checks", async () => {
    it("should revert if parameter value is not allowed", async () => {
      const { guard, avatar, tx } = await setupTests();
      const functionSig = ethers.utils.id("mint(address,uint256)").slice(0, 10);
      const paramValue = ethers.utils.hexZeroPad(user2.address, 32);
      const amount = ethers.utils.hexZeroPad(ethers.utils.hexlify(123456), 32);
      const calldata = functionSig + paramValue.slice(2) + amount.slice(2);

      await guard.setTargetAllowed(avatar.address, true);
      await guard.setScoped(avatar.address, true);
      await guard.setAllowedFunction(avatar.address, functionSig, true);

      tx.data = calldata;
      await expect(
        guard.checkTransaction(
          tx.to,
          tx.value,
          tx.data,
          tx.operation,
          tx.avatarTxGas,
          tx.baseGas,
          tx.gasPrice,
          tx.gasToken,
          tx.refundReceiver,
          tx.signatures,
          user1.address
        )
      ).to.be.revertedWith("Parameter value is not allowed");
    });

    it("should allow transaction if parameter value is allowed", async () => {
      const { guard, avatar, tx } = await setupTests();
      const functionSig = ethers.utils.id("mint(address,uint256)").slice(0, 10);
      const paramValue = ethers.utils.hexZeroPad(user2.address, 32).toLowerCase();
      const amount = ethers.utils.hexZeroPad(ethers.utils.hexlify(123456), 32);      
      const calldata = functionSig + paramValue.slice(2) + amount.slice(2);
      await guard.setTargetAllowed(avatar.address, true);
      await guard.setScoped(avatar.address, true);
      await guard.setAllowedFunction(avatar.address, functionSig, true);
      await guard.setAllowedParameter(avatar.address, functionSig, 0, paramValue, true);

      tx.data = calldata;
      await expect(
        guard.checkTransaction(
          tx.to,
          tx.value,
          tx.data,
          tx.operation,
          tx.avatarTxGas,
          tx.baseGas,
          tx.gasPrice,
          tx.gasToken,
          tx.refundReceiver,
          tx.signatures,
          user1.address
        )
      ).not.to.be.reverted;
    });
  });
});
