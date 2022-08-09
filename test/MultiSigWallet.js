const chai = require("chai");
const { waffle } = require("hardhat");
const hre = require("hardhat");
const ethers = hre.ethers;
const { expect } = chai;

describe("MultiSigWallet: ", function () {
  let MultiSigWallet, multiSigWallet, owner, addr1, addr2;

  before(async () => {
    MultiSigWallet = await ethers.getContractFactory('MultiSigWallet');
    
    [owner, addr1, addr2, _] = await ethers.getSigners();
    // console.log(owner.address)

    multiSigWallet = await MultiSigWallet.deploy([owner.address, addr1.address], 2);

    console.log("\tMutiSigWallet Contract Address: "+multiSigWallet.address)

  });

  describe('Testing Workflow', ()=> {
    it('Should set the right owners with number of confirmations', async () => {
        await expect(await multiSigWallet.getOwners()).to.eql([owner.address, addr1.address])
        await expect(await multiSigWallet.numConfirmationsRequired()).to.equal(2)
    });


    it('Should submit transaction to wallet', async () => {

      const inputData = "0x2e7700f0" // Get Transcation Cout
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
      console.log("\n\n\t",receipt.events[0].event, ""+receipt.events[0].args[0]+" ,  "+receipt.events[0].args[1]+" ,  "+receipt.events[0].args[2]) 
    });

    

    it('Should submit and execute another transaction to wallet', async () => {

      const inputData = "0x2e7700f0" // Get Transcation Cout
      await multiSigWallet.connect(addr1).submitTransaction(multiSigWallet.address, 0, inputData);
      await multiSigWallet.confirmTransaction(1);
      await multiSigWallet.connect(addr1).confirmTransaction(1);

      const tx = await multiSigWallet.connect(owner).executeTransaction(1)
      const receipt = await tx.wait();
      expect(receipt.events[0].event).to.be.equal('ExecuteTransaction');
      console.log("\n\n\t",receipt.events[0].event, ""+receipt.events[0].args[0]+" ,  "+receipt.events[0].args[1]+" ,  "+receipt.events[0].args[2]) 

     
    });


    // it('Fund the contract', async () => {

    //   const provider = waffle.provider;

    //   expect( await provider.getBalance(multiSigWallet.address)).to.equal(0);

    //   await owner.sendTransaction({to: multiSigWallet.address, value: 5})

    //   expect( await provider.getBalance(multiSigWallet.address)).to.equal(5);

    // });
    
  })

});
