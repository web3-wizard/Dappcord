const { expect } = require("chai");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Dappcord", function () {
  let dappcord, result, transaction;
  let deployer, user;

  const NAME = "Dappcord";
  const SYMBOL = "DC";

  beforeEach(async function () {
    // setup accounts
    [deployer, user] = await ethers.getSigners();

    // Deploy the contract
    const Dappcord = await ethers.getContractFactory("Dappcord");
    dappcord = await Dappcord.deploy(NAME, SYMBOL);

    // Create a Channel
    transaction = await dappcord
      .connect(deployer)
      .createChannel("general", tokens(1));
    await transaction.wait();
  });

  describe("Deployment", () => {
    it("Fetch name and symbol", async () => {
      // Fetch name
      result = await dappcord.name();
      // Check name
      expect(result).to.be.equal(NAME);

      // Fetch symbol
      result = await dappcord.symbol();
      // Check symbol
      expect(result).to.be.equal(SYMBOL);
    });

    it("Fetch owner of the contract", async () => {
      result = await dappcord.owner();
      expect(result).to.be.equal(deployer.address);
    });
  });

  describe("Creating Channels", () => {
    it("Returns total number of channels", async () => {
      result = await dappcord.totalChannels();
      expect(result).to.be.equal(1);
    });

    it("Returns channel attributes", async () => {
      result = await dappcord.getChannel(1);
      expect(result.id).to.be.equal(1);
      expect(result.name).to.be.equal("general");
      expect(result.cost).to.be.equal(tokens(1));
    });
  });

  describe("Joining Channels", () => {
    const ID = 1;
    const AMOUNT = ethers.utils.parseUnits("1", "ether");

    beforeEach(async () => {
      transaction = await dappcord.connect(user).mint(ID, { value: AMOUNT });
      await transaction.wait();
    });

    it("Join the user", async () => {
      result = await dappcord.hasJoined(ID, user.address);
      expect(result).to.be.equal(true);
    });

    it("Increases total supply", async () => {
      result = await dappcord.totalSupply();
      expect(result).to.be.equal(ID);
    });

    it("Updates the contract balance", async () => {
      result = await ethers.provider.getBalance(dappcord.address);
      expect(result).to.be.equal(AMOUNT);
    });
  });

  describe("Withdrawing", () => {
    const ID = 1;
    const AMOUNT = ethers.utils.parseUnits("10", "ether");
    let balanceBefore;

    beforeEach(async () => {
      balanceBefore = await ethers.provider.getBalance(deployer.address);

      let transaction = await dappcord
        .connect(user)
        .mint(ID, { value: AMOUNT });
      await transaction.wait();

      transaction = await dappcord.connect(deployer).withdraw();
      await transaction.wait();
    });

    it("Updates the owner balance", async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Updates the contract balance", async () => {
      result = await ethers.provider.getBalance(dappcord.address);
      expect(result).to.be.equal(0);
    });
  });
});
