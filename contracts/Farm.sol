// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../openzeppelin/contracts/access/AccessControl.sol";

contract Farm is AccessControl{
    using SafeERC20 for ERC20;

    ERC20 public stakeToken;  

    ERC20 public rewardToken;

    uint256 public rewardPercentPerSecond;

    uint256 public totalBalanceTokenA;

    uint256 public totalDepositTokenB;

    mapping (address => UserPosition) public userPosition;

    struct UserPosition {
        uint256 depositAmount;      // user's amount of deposited token B
        uint256 startTime;          // time when deposit starts
        uint256 owedTokenA;         // amount tha contract already owes to user (before endTime)
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Farm: Caller is not the Admin");
        _;
    }

    constructor(address tokenA, address tokenB, address admin){
        _setupRole(DEFAULT_ADMIN_ROLE, admin);

        stakeToken = ERC20(tokenB);
        rewardToken = ERC20(tokenA);
    }

    //************* ADMIN FUNCTIONS *************//

    function setRewardPercent(uint256 rewardPercent_) public onlyAdmin {
        rewardPercentPerSecond = rewardPercent_;       
    }

    function addRewardToken(uint256 rewardTokenAmount) public onlyAdmin returns (uint256){
        totalBalanceTokenA += rewardTokenAmount;
        return(totalBalanceTokenA);
    }

    //************* PUBLIC FUNCTIONS *************//

    function depositTokenB(uint256 depositTokenBAmount) public {
        require(depositTokenBAmount > 0, "Farm: depositTokenBAmount shoud not be zero");

        UserPosition storage user  = userPosition[msg.sender];
        stakeToken.safeTransferFrom(address(msg.sender), address(this), depositTokenBAmount);
        if(user.depositAmount > 0){
            user.owedTokenA = calculateReward(user);
        } else{
            user.owedTokenA = 0;
        }
        user.depositAmount += depositTokenBAmount;
        user.startTime = block.timestamp;

        totalDepositTokenB += depositTokenBAmount;
    }

    function withdrawAll() public {
        UserPosition storage user  = userPosition[msg.sender];
        uint256 rewardAmount = calculateReward(user);
        require(rewardAmount < totalBalanceTokenA, "Farm: thare is not enough token A on farm contract. Please wait or contact admin");

        stakeToken.safeTransferFrom(address(this), address(msg.sender), user.depositAmount);
        rewardToken.safeTransferFrom(address(this), address(msg.sender), rewardAmount);

        totalBalanceTokenA -= rewardAmount;
        delete userPosition[msg.sender];
    }

    //************* VIEW FUNCTIONS *************//

    function getUserPositionAmount() public view returns(uint256){
        return userPosition[msg.sender].depositAmount;
    }

    function getUserPositionStartTime() public view returns(uint256){
        return userPosition[msg.sender].startTime;
    }

    function checkCurrentRewardBalance() public view returns(uint256){
        return calculateReward(userPosition[msg.sender]);
    }

    //************* END VIEW FUNCTIONS *************//

    function calculateReward(UserPosition memory user) private view returns(uint256 rewardAmount) {
        rewardAmount = user.depositAmount * rewardPercentPerSecond / 100 * (block.timestamp - user.startTime);
    }
 
}