import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { task, types } from "hardhat/config";
import { deployAndSetUpModule } from "@gnosis.pm/zodiac";
import { HardhatRuntimeEnvironment } from "hardhat/types";

interface ScopeGuardTaskArgs {
  owner: string;
  proxied: boolean;
}

const deployScopeGuard = async (
  taskArgs: ScopeGuardTaskArgs,
  hardhatRuntime: HardhatRuntimeEnvironment
) => {
  const [caller] = await hardhatRuntime.ethers.getSigners();
  console.log("Using the account:", caller.address);

  if (taskArgs.proxied) {
    const chainId = await hardhatRuntime.getChainId();
    const { transaction } = await deployAndSetUpModule(
      "scopeGuard",
      {
        types: ["address"],
        values: [taskArgs.owner],
      },
      hardhatRuntime.ethers.provider,
      Number(chainId),
      Date.now().toString()
    );

    const deploymentTransaction = await caller.sendTransaction(transaction);
    const receipt = await deploymentTransaction.wait();
    console.log("ScopeGuard deployed to:", receipt.logs[1].address);
    return;
  }

  const Guard = await hardhatRuntime.ethers.getContractFactory("ScopeGuard");
  const guard = await Guard.deploy(taskArgs.owner);
  await guard.deployed();
  console.log("ScopeGuard deployed to:", guard.address);
};

task("setup", "Deploys a ScopeGuard")
  .addParam("owner", "Address of the Owner", undefined, types.string)
  .addParam("proxied", "Deploys contract through factory", false, types.boolean, true)
  .setAction(deployScopeGuard);

task("verifyEtherscan", "Verifies the contract on etherscan")
  .addParam("guard", "Address of the ScopeGuard", undefined, types.string)
  .addParam("owner", "Address of the Owner", undefined, types.string)
  .setAction(async (taskArgs, hardhatRuntime) => {
    await hardhatRuntime.run("verify", {
      address: taskArgs.guard,
      constructorArguments: [taskArgs.owner],
    });
  });

task("setTargetAllowed", "Sets whether a target address is allowed")
  .addParam("guard", "The address of the guard", undefined, types.string)
  .addParam("target", "The target address", undefined, types.string)
  .addParam("allowed", "True if the target should be allowed", true, types.boolean)
  .setAction(async (taskArgs, hardhatRuntime) => {
    const guard = await hardhatRuntime.ethers.getContractAt("ScopeGuard", taskArgs.guard);
    const tx = await guard.setTargetAllowed(taskArgs.target, taskArgs.allowed);
    await tx.wait();
    console.log(`Target ${taskArgs.target} allowed: ${taskArgs.allowed}`);
  });

task("setDelegateCallAllowed", "Sets whether delegate calls are allowed to a target address")
  .addParam("guard", "The address of the guard", undefined, types.string)
  .addParam("target", "The target address", undefined, types.string)
  .addParam("allowed", "True if delegate calls should be allowed", true, types.boolean)
  .setAction(async (taskArgs, hardhatRuntime) => {
    const guard = await hardhatRuntime.ethers.getContractAt("ScopeGuard", taskArgs.guard);
    const tx = await guard.setDelegateCallAllowedOnTarget(taskArgs.target, taskArgs.allowed);
    await tx.wait();
    console.log(`Delegate calls to ${taskArgs.target} allowed: ${taskArgs.allowed}`);
  });

task("setScoped", "Sets whether a target address is scoped")
  .addParam("guard", "The address of the guard", undefined, types.string)
  .addParam("target", "The target address", undefined, types.string)
  .addParam("scoped", "True if the target should be scoped", true, types.boolean)
  .setAction(async (taskArgs, hardhatRuntime) => {
    const guard = await hardhatRuntime.ethers.getContractAt("ScopeGuard", taskArgs.guard);
    const tx = await guard.setScoped(taskArgs.target, taskArgs.scoped);
    await tx.wait();
    console.log(`Target ${taskArgs.target} scoped: ${taskArgs.scoped}`);
  });

task("setFallbackAllowed", "Sets whether fallback is allowed on a target address")
  .addParam("guard", "The address of the guard", undefined, types.string)
  .addParam("target", "The target address", undefined, types.string)
  .addParam("allowed", "True if fallback should be allowed", true, types.boolean)
  .setAction(async (taskArgs, hardhatRuntime) => {
    const guard = await hardhatRuntime.ethers.getContractAt("ScopeGuard", taskArgs.guard);
    const tx = await guard.setFallbackAllowedOnTarget(taskArgs.target, taskArgs.allowed);
    await tx.wait();
    console.log(`Fallback on ${taskArgs.target} allowed: ${taskArgs.allowed}`);
  });

task("setValueAllowed", "Sets whether value transfers are allowed to a target address")
  .addParam("guard", "The address of the guard", undefined, types.string)
  .addParam("target", "The target address", undefined, types.string)
  .addParam("allowed", "True if value transfers should be allowed", true, types.boolean)
  .setAction(async (taskArgs, hardhatRuntime) => {
    const guard = await hardhatRuntime.ethers.getContractAt("ScopeGuard", taskArgs.guard);
    const tx = await guard.setValueAllowedOnTarget(taskArgs.target, taskArgs.allowed);
    await tx.wait();
    console.log(`Value transfers to ${taskArgs.target} allowed: ${taskArgs.allowed}`);
  });

task("setAllowedFunction", "Sets whether a function is allowed on a target address")
  .addParam("guard", "The address of the guard", undefined, types.string)
  .addParam("target", "The target address", undefined, types.string)
  .addParam("sig", "The function signature to allow", undefined, types.string)
  .addParam("allowed", "True if the function should be allowed", true, types.boolean)
  .setAction(async (taskArgs, hardhatRuntime) => {
    const guard = await hardhatRuntime.ethers.getContractAt("ScopeGuard", taskArgs.guard);
    const tx = await guard.setAllowedFunction(taskArgs.target, taskArgs.sig, taskArgs.allowed);
    await tx.wait();
    console.log(`Function ${taskArgs.sig} on ${taskArgs.target} allowed: ${taskArgs.allowed}`);
  });

task("setAllowedParameter", "Sets whether a parameter is allowed for a function on a target address")
  .addParam("guard", "The address of the guard", undefined, types.string)
  .addParam("target", "The target address", undefined, types.string)
  .addParam("sig", "The function signature to allow the parameter for", undefined, types.string)
  .addParam("index", "The index of the parameter to allow", undefined, types.int)
  .addParam("value", "The parameter value to allow", undefined, types.string)
  .addParam("allowed", "True if the parameter should be allowed", true, types.boolean)
  .setAction(async (taskArgs, hardhatRuntime) => {
    const guard = await hardhatRuntime.ethers.getContractAt("ScopeGuard", taskArgs.guard);
    const tx = await guard.setAllowedParameter(taskArgs.target, taskArgs.sig, taskArgs.index, taskArgs.value, taskArgs.allowed);
    await tx.wait();
    console.log(`Parameter ${taskArgs.value} for function ${taskArgs.sig} on ${taskArgs.target} allowed: ${taskArgs.allowed}`);
  });

task("transferOwnership", "Transfers ownership of the guard contract")
  .addParam("guard", "The address of the guard", undefined, types.string)
  .addParam("newowner", "The address of the new owner", undefined, types.string)
  .setAction(async (taskArgs, hardhatRuntime) => {
    const guard = await hardhatRuntime.ethers.getContractAt("ScopeGuard", taskArgs.guard);
    const tx = await guard.transferOwnership(taskArgs.newowner);
    await tx.wait();
    console.log("ScopeGuard now owned by:", taskArgs.newowner);
  });

task("getFunctionSignature", "Returns the four-byte function signature of a given string")
  .addParam("function", "The string representation of the function selector", undefined, types.string)
  .setAction(async (taskArgs, hardhatRuntime) => {
    console.log(
      hardhatRuntime.ethers.utils.solidityKeccak256(["string"], [taskArgs.function]).substring(0, 10)
    );
  });

  task("flat", "Flattens and prints contracts and their dependencies (Resolves licenses)")
  .addOptionalVariadicPositionalParam("files", "The files to flatten", undefined, types.inputFile)
  .setAction(async ({ files }, hre) => {
    let flattened = await hre.run("flatten:get-flattened-sources", { files });
    
    // Remove every line started with "// SPDX-License-Identifier:"
    flattened = flattened.replace(/SPDX-License-Identifier:/gm, "License-Identifier:");
    flattened = `// SPDX-License-Identifier: MIXED\n\n${flattened}`;

    // Remove every line started with "pragma experimental ABIEncoderV2;" except the first one
    flattened = flattened.replace(/pragma experimental ABIEncoderV2;\n/gm, ((i) => (m: any) => (!i++ ? m : ""))(0));
    console.log(flattened);
  });


export {};
