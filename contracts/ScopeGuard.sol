// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "@gnosis.pm/zodiac/contracts/guard/BaseGuard.sol";
import "@gnosis.pm/zodiac/contracts/factory/FactoryFriendly.sol";
// import "hardhat/console.sol";


contract ScopeGuard is FactoryFriendly, BaseGuard {
    event SetTargetAllowed(address target, bool allowed);
    event SetTargetScoped(address target, bool scoped);
    event SetFallbackAllowedOnTarget(address target, bool allowed);
    event SetValueAllowedOnTarget(address target, bool allowed);
    event SetDelegateCallAllowedOnTarget(address target, bool allowed);
    event SetFunctionAllowedOnTarget(
        address target,
        bytes4 functionSig,
        bool allowed
    );
    event SetAllowedParameterOnTarget(
        address target,
        bytes4 functionSig,
        uint256 paramIndex,
        bytes32 allowedValue,
        bool allowed
    );
    event ScopeGuardSetup(address indexed initiator, address indexed owner);

    constructor(address _owner) {
        bytes memory initializeParams = abi.encode(_owner);
        setUp(initializeParams);
    }

    /// @dev Initialize function, will be triggered when a new proxy is deployed
    /// @param initializeParams Parameters of initialization encoded
    function setUp(bytes memory initializeParams) public override {
        __Ownable_init();
        address _owner = abi.decode(initializeParams, (address));

        transferOwnership(_owner);

        emit ScopeGuardSetup(msg.sender, _owner);
    }

    struct Target {
        bool allowed;
        bool scoped;
        bool delegateCallAllowed;
        bool fallbackAllowed;
        bool valueAllowed;
        mapping(bytes4 => bool) allowedFunctions;
        mapping(bytes4 => mapping(uint256 => mapping(bytes32 => bool))) allowedParameters;
    }

    mapping(address => Target) public allowedTargets;

    /// @dev Set whether or not calls can be made to an address.
    /// @notice Only callable by owner.
    /// @param target Address to be allowed/disallowed.
    /// @param allow Bool to allow (true) or disallow (false) calls to target.
    function setTargetAllowed(address target, bool allow) public onlyOwner {
        allowedTargets[target].allowed = allow;
        emit SetTargetAllowed(target, allowedTargets[target].allowed);
    }

    /// @dev Set whether or not delegate calls can be made to a target.
    /// @notice Only callable by owner.
    /// @param target Address to which delegate calls should be allowed/disallowed.
    /// @param allow Bool to allow (true) or disallow (false) delegate calls to target.
    function setDelegateCallAllowedOnTarget(address target, bool allow)
        public
        onlyOwner
    {
        allowedTargets[target].delegateCallAllowed = allow;
        emit SetDelegateCallAllowedOnTarget(
            target,
            allowedTargets[target].delegateCallAllowed
        );
    }

    /// @dev Sets whether or not calls to an address should be scoped to specific function signatures.
    /// @notice Only callable by owner.
    /// @param target Address to be scoped/unscoped.
    /// @param scoped Bool to scope (true) or unscope (false) function calls on target.
    function setScoped(address target, bool scoped) public onlyOwner {
        allowedTargets[target].scoped = scoped;
        emit SetTargetScoped(target, allowedTargets[target].scoped);
    }

    /// @dev Sets whether or not a target can be sent to (incluces fallback/receive functions).
    /// @notice Only callable by owner.
    /// @param target Address to be allow/disallow sends to.
    /// @param allow Bool to allow (true) or disallow (false) sends on target.
    function setFallbackAllowedOnTarget(address target, bool allow)
        public
        onlyOwner
    {
        allowedTargets[target].fallbackAllowed = allow;
        emit SetFallbackAllowedOnTarget(
            target,
            allowedTargets[target].fallbackAllowed
        );
    }

    /// @dev Sets whether or not a target can be sent to (incluces fallback/receive functions).
    /// @notice Only callable by owner.
    /// @param target Address to be allow/disallow sends to.
    /// @param allow Bool to allow (true) or disallow (false) sends on target.
    function setValueAllowedOnTarget(address target, bool allow)
        public
        onlyOwner
    {
        allowedTargets[target].valueAllowed = allow;
        emit SetValueAllowedOnTarget(
            target,
            allowedTargets[target].valueAllowed
        );
    }

    /// @dev Sets whether or not a specific function signature should be allowed on a scoped target.
    /// @notice Only callable by owner.
    /// @param target Scoped address on which a function signature should be allowed/disallowed.
    /// @param functionSig Function signature to be allowed/disallowed.
    /// @param allow Bool to allow (true) or disallow (false) calls a function signature on target.
    function setAllowedFunction(
        address target,
        bytes4 functionSig,
        bool allow
    ) public onlyOwner {
        allowedTargets[target].allowedFunctions[functionSig] = allow;
        emit SetFunctionAllowedOnTarget(
            target,
            functionSig,
            allowedTargets[target].allowedFunctions[functionSig]
        );
    }

    /// @dev Sets whether or not a specific parameter value should be allowed for a function on a scoped target.
    /// @notice Only callable by owner.
    /// @param target Scoped address on which a function signature and parameter should be allowed/disallowed.
    /// @param functionSig Function signature to be allowed/disallowed.
    /// @param paramIndex Index of the parameter to be allowed/disallowed.
    /// @param allowedValue Value of the parameter to be allowed/disallowed.
    /// @param allow Bool to allow (true) or disallow (false) parameter value for the function on target.
    function setAllowedParameter(
        address target,
        bytes4 functionSig,
        uint256 paramIndex,
        bytes32 allowedValue,
        bool allow
    ) public onlyOwner {
        allowedTargets[target].allowedParameters[functionSig][paramIndex][allowedValue] = allow;
        emit SetAllowedParameterOnTarget(
            target,
            functionSig,
            paramIndex,
            allowedValue,
            allow
        );
    }

    /// @dev Returns bool to indicate if an address is an allowed target.
    /// @param target Address to check.
    function isAllowedTarget(address target) public view returns (bool) {
        return (allowedTargets[target].allowed);
    }

    /// @dev Returns bool to indicate if an address is scoped.
    /// @param target Address to check.
    function isScoped(address target) public view returns (bool) {
        return (allowedTargets[target].scoped);
    }

    /// @dev Returns bool to indicate if fallback is allowed to a target.
    /// @param target Address to check.
    function isfallbackAllowed(address target) public view returns (bool) {
        return (allowedTargets[target].fallbackAllowed);
    }

    /// @dev Returns bool to indicate if ETH can be sent to a target.
    /// @param target Address to check.
    function isValueAllowed(address target) public view returns (bool) {
        return (allowedTargets[target].valueAllowed);
    }

    /// @dev Returns bool to indicate if a function signature is allowed for a target address.
    /// @param target Address to check.
    /// @param functionSig Signature to check.
    function isAllowedFunction(address target, bytes4 functionSig)
        public
        view
        returns (bool)
    {
        return (allowedTargets[target].allowedFunctions[functionSig]);
    }

    /// @dev Returns bool to indicate if delegate calls are allowed to a target address.
    /// @param target Address to check.
    function isAllowedToDelegateCall(address target)
        public
        view
        returns (bool)
    {
        return (allowedTargets[target].delegateCallAllowed);
    }

    // solhint-disallow-next-line payable-fallback
    fallback() external {
        // We don't revert on fallback to avoid issues in case of a Safe upgrade
        // E.g. The expected check method might change and then the Safe would be locked.
    }

    function checkTransaction(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation,
        uint256,
        uint256,
        uint256,
        address,
        // solhint-disallow-next-line no-unused-vars
        address payable,
        bytes memory,
        address
    ) external view override {
        require(
            operation != Enum.Operation.DelegateCall ||
                allowedTargets[to].delegateCallAllowed,
            "Delegate call not allowed to this address"
        );
        require(allowedTargets[to].allowed, "Target address is not allowed");
        if (value > 0) {
            require(
                allowedTargets[to].valueAllowed,
                "Cannot send ETH to this target"
            );
        }
        if (data.length >= 4) {
            bytes4 functionSig = bytes4(data);
            require(
                !allowedTargets[to].scoped ||
                    allowedTargets[to].allowedFunctions[functionSig],
                "Target function is not allowed"
            );

            if (allowedTargets[to].scoped) {
                checkParameters(to, functionSig, data);
            }
        } else {
            require(data.length == 0, "Function signature too short");
            require(
                !allowedTargets[to].scoped ||
                    allowedTargets[to].fallbackAllowed,
                "Fallback not allowed for this address"
            );
        }
    }

    function checkParameters(
        address to,
        bytes4 functionSig,
        bytes memory data
    ) internal view {
        // uint256 paramCount = (data.length - 4) / 32;
        for (uint256 i = 0; i < 1; i++) {
            bytes32 paramValue;
            assembly {
                paramValue := mload(add(data, add(36, mul(i, 32))))
            }

            // console.logBytes32(paramValue);
            // console.log(allowedTargets[to].allowedParameters[functionSig][i][paramValue]);

            require(
                allowedTargets[to].allowedParameters[functionSig][i][paramValue],
                "Parameter value is not allowed"
            );
        }
    }

    function checkAfterExecution(bytes32, bool) external view override {}
}
