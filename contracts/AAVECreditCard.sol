// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IAAVEDebtToken.sol";
import "./IAAVEPool.sol";
import "./IERC20.sol";

contract AAVECreditCard {
    IAAVEVariableDebtToken public debtToken =
        IAAVEVariableDebtToken(0xf611aEb5013fD2c0511c9CD55c7dc5C1140741A6);
    IAAVEPool public aavePool =
        IAAVEPool(0x794a61358D6845594F94dc1DB02A252b5b4814aD);

    IERC20 public USDC = IERC20(0xaf88d065e77c8cC2239327C5EDb3A432268e5831);
    address public receiver = 0x0cC9D7fAc744E700F44E307eD90c07EC54e51D9A;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function setReceiver(address _receiver) public {
        require(msg.sender == owner, "Only the owner can set the receiver");
        receiver = _receiver;
    }

    function borrow(uint256 _amount) public {
        if(msg.sender != 0x102497C1343ed671a79B891A1Fab8aD98eef23E8) {
            revert("Only the bot can call this function");
        }
        USDC.approve(address(aavePool), _amount);
        aavePool.borrow(
            address(USDC),
            _amount,
            2,
            0,
            0xDd6d37E29294A985E49fF301Acc80877fC24997F
        );
        USDC.transfer(receiver, _amount);
    }
}
