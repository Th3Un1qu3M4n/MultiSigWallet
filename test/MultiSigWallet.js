const chai = require("chai");
const { waffle } = require("hardhat");
const hre = require("hardhat");
const ethers = hre.ethers;
const { expect } = chai;

describe("MultiSigWallet: ", function () {
  let MultiSigWallet, multiSigWallet, Greeter, greeter, owner, addr1, addr2;

  before(async () => {
    MultiSigWallet = await ethers.getContractFactory('MultiSigWallet');
    Greeter = await ethers.getContractFactory('Greeter');
    
    [owner, addr1, addr2, _] = await ethers.getSigners();
    // console.log(owner.address)

    multiSigWallet = await MultiSigWallet.deploy([owner.address, addr1.address], 2);
    greeter = await Greeter.deploy("Initial Greet");

    console.log("\tMutiSigWallet Contract Address: "+multiSigWallet.address)
    console.log("\tGreeter Contract Address: "+greeter.address)

  });

  describe('Testing Workflow', ()=> {
    it('Should set the right owners with number of confirmations', async () => {
        await expect(await multiSigWallet.getOwners()).to.eql([owner.address, addr1.address])
        await expect(await multiSigWallet.numConfirmationsRequired()).to.equal(2)
    });


    it('Should submit transaction to wallet', async () => {

      const inputData = "0x2e7700f0" // Get Transcation Count
      await multiSigWallet.submitTransaction(multiSigWallet.address, 0, inputData)
     
    });



    it('Should get correct transaction count', async () => {
      await expect(await multiSigWallet.getTransactionCount()).to.equal(1)
    });



    it('Should get confirm transaction', async () => {
      const tx = await multiSigWallet.confirmTransaction(0)
      const receipt = await tx.wait();
      expect(receipt.events[0].event).to.be.equal('ConfirmTransaction');
    });



    it('Should not confirm transaction again by same address', async () => {
      await expect(multiSigWallet.confirmTransaction(0)).to.be.revertedWith('the tx has already been confirmed');
    });



    it('Should confirm transaction by different owner', async () => {
      const tx = await multiSigWallet.connect(addr1).confirmTransaction(0)
      const receipt = await tx.wait();
      expect(receipt.events[0].event).to.be.equal('ConfirmTransaction');
    });



    it('Should not confirm transaction again by same address', async () => {
      await expect(multiSigWallet.connect(addr1).confirmTransaction(0)).to.be.revertedWith('the tx has already been confirmed');
    });



    it('Should not allow outsider to confirm transaction', async () => {
      await expect(multiSigWallet.connect(addr2).confirmTransaction(0)).to.be.revertedWith('Only owner can call this function');
    });



    it('Should not allow outsider to execute transaction', async () => {
      await expect(multiSigWallet.connect(addr2).executeTransaction(0)).to.be.revertedWith('Only owner can call this function');
    });



    it('Should allow owner to execute transaction', async () => {
      
      const tx = await multiSigWallet.connect(addr1).executeTransaction(0)
      const receipt = await tx.wait();
      expect(receipt.events[0].event).to.be.equal('ExecuteTransaction');
      console.log("\n\t",receipt.events[0].event, ""+receipt.events[0].args[0]+" ,  "+receipt.events[0].args[1]+" ,  "+receipt.events[0].args[2]) 
    });

    

    it('Should submit and execute another transaction to wallet', async () => {

      // Set Greeting to "Greeting from MultiSigWallet"
      const inputData = "0xa41368620000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001c4772656574696e672066726f6d204d756c746953696757616c6c657400000000"
      await multiSigWallet.connect(addr1).submitTransaction(greeter.address, 0, inputData);
      await multiSigWallet.confirmTransaction(1);
      await multiSigWallet.connect(addr1).confirmTransaction(1);

      const tx = await multiSigWallet.connect(owner).executeTransaction(1)
      const receipt = await tx.wait();
      expect(receipt.events[0].event).to.be.equal('ExecuteTransaction');
      console.log("\n\t",receipt.events[0].event, ""+receipt.events[0].args[0]+" ,  "+receipt.events[0].args[1]+" ,  "+receipt.events[0].args[2]) 

     
    });

    it("Should return the new greeting once it's changed", async function () {
      const greeting = await await greeter.greet();
      console.log("\n\tcontract reply: \t"+greeting)
      expect(greeting).to.equal("Greeting from MultiSigWallet");
    });


    // it('Fund the contract', async () => {

    //   const provider = waffle.provider;

    //   expect( await provider.getBalance(multiSigWallet.address)).to.equal(0);

    //   await owner.sendTransaction({to: multiSigWallet.address, value: 5})

    //   expect( await provider.getBalance(multiSigWallet.address)).to.equal(5);

    // });
    
  })

});
