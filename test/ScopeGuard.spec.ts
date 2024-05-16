import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { AddressZero } from "@ethersproject/constants";

describe("ScopeGuard", async () => {
  const [user1, user2, user3] = waffle.provider.getWallets();

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
      value: 1,
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

  async function runCheckTransactionTest({
    targetAllowed,
    scoped,
    functionAllowed,
    parameterAllowed,
    checkSecondParameter,
    valueAllowed,
    expectedRevertMessage,
  }: {
    targetAllowed: boolean;
    scoped: boolean;
    functionAllowed: boolean;
    parameterAllowed: boolean;
    checkSecondParameter: boolean;
    valueAllowed: boolean;
    expectedRevertMessage?: string;
  }) {
    const { guard, avatar, tx } = await setupTests();
    const functionSig = ethers.utils.id("mint(address,uint256)").slice(0, 10);
    const paramValue = ethers.utils.hexZeroPad(user2.address, 32).toLowerCase();
    const amount = ethers.utils.hexZeroPad(ethers.utils.hexlify(123456), 32);
    const calldata = functionSig + paramValue.slice(2) + amount.slice(2);
    const paramValue2 = ethers.utils.hexZeroPad(user3.address, 32).toLowerCase();
    if (targetAllowed) await guard.setTargetAllowed(avatar.address, true);
    if (scoped) await guard.setScoped(avatar.address, true);
    if (functionAllowed) await guard.setAllowedFunction(avatar.address, functionSig, true);
    if (parameterAllowed) {
      await guard.setAllowedParameter(avatar.address, functionSig, 0, paramValue, true);
      await guard.setAllowedParameter(avatar.address, functionSig, 0, paramValue2, true);
    }
    if (valueAllowed) await guard.setValueAllowedOnTarget(avatar.address, true);

    tx.data = calldata;
    if (checkSecondParameter) {
      tx.data = functionSig + paramValue2.slice(2) + amount.slice(2);
    }

    if (expectedRevertMessage) {
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
      ).to.be.revertedWith(expectedRevertMessage);
    } else {
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
    }
  }

  describe("checkTransaction() with parameter checks", async () => {
    it("should allow transaction if parameter value is allowed, target is allowed, function is allowed", async () => {
      await runCheckTransactionTest({
        targetAllowed: true,
        scoped: true,
        functionAllowed: true,
        parameterAllowed: true,
        checkSecondParameter: false,
        valueAllowed: true,
      });
    });

    it("should revert if parameter value is not allowed, but target is allowed, function is allowed", async () => {
      await runCheckTransactionTest({
        targetAllowed: true,
        scoped: true,
        functionAllowed: true,
        parameterAllowed: false,
        checkSecondParameter: false,
        valueAllowed: true,
        expectedRevertMessage: "Parameter value is not allowed",
      });
    });

    it("should revert if parameter is allowed, target is allowed but function is not allowed", async () => {
      await runCheckTransactionTest({
        targetAllowed: true,
        scoped: true,
        functionAllowed: false,
        parameterAllowed: true,
        checkSecondParameter: false,
        valueAllowed: true,
        expectedRevertMessage: "Target function is not allowed",
      });
    });

    it("should revert if parameter is allowed, target is not allowed but function is allowed", async () => {
      await runCheckTransactionTest({
        targetAllowed: false,
        scoped: true,
        functionAllowed: true,
        parameterAllowed: true,
        checkSecondParameter: false,
        valueAllowed: true,
        expectedRevertMessage: "Target address is not allowed",
      });
    });

    it("should revert if parameter is not allowed, target is not allowed, function is allowed", async () => {
      await runCheckTransactionTest({
        targetAllowed: false,
        scoped: true,
        functionAllowed: true,
        parameterAllowed: false,
        checkSecondParameter: false,
        valueAllowed: true,
        expectedRevertMessage: "Target address is not allowed",
      });
    });

    it("should revert if parameter is not allowed, target is allowed, function is not allowed", async () => {
      await runCheckTransactionTest({
        targetAllowed: true,
        scoped: true,
        functionAllowed: false,
        parameterAllowed: false,
        checkSecondParameter: false,
        valueAllowed: true,
        expectedRevertMessage: "Target function is not allowed",
      });
    });

    it("should revert if parameter is allowed, target is not allowed, function is not allowed", async () => {
      await runCheckTransactionTest({
        targetAllowed: false,
        scoped: true,
        functionAllowed: false,
        parameterAllowed: true,
        checkSecondParameter: false,
        valueAllowed: false,
        expectedRevertMessage: "Target address is not allowed",
      });
    });

    it("should revert if parameter is not allowed, target is not allowed, function is not allowed", async () => {
      await runCheckTransactionTest({
        targetAllowed: false,
        scoped: true,
        functionAllowed: false,
        parameterAllowed: false,
        checkSecondParameter: false,
        valueAllowed: true,
        expectedRevertMessage: "Target address is not allowed",
      });
    });

    it("should revert if value is not allowed on target", async () => {
      await runCheckTransactionTest({
        targetAllowed: true,
        scoped: true,
        functionAllowed: true,
        parameterAllowed: true,
        checkSecondParameter: false,
        valueAllowed: false,
        expectedRevertMessage: "Cannot send ETH to this target",
      });
    });

    it("should allow value if value is allowed on target", async () => {
      await runCheckTransactionTest({
        targetAllowed: true,
        scoped: true,
        functionAllowed: true,
        parameterAllowed: true,
        checkSecondParameter: false,
        valueAllowed: true,
      });
    });

    it("should allow transaction if we use calldata from 2nd parameter", async () => {
      await runCheckTransactionTest({
        targetAllowed: true,
        scoped: true,
        functionAllowed: true,
        parameterAllowed: true,
        checkSecondParameter: true,
        valueAllowed: true,
      });
    });

  });
});
