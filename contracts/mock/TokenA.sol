// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../../openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenA is ERC20{

    uint8 private _decimals;
    string name_ = "TokenA";
    string symbol_ = "TA";

    constructor(uint8 decimals_) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    function mint(uint256 amount) public {
        _mint(msg.sender, amount);
    }

    function decimals() public view override returns (uint8){
        return _decimals;
    }

}