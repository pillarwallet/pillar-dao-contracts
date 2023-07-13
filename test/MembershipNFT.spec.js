const { ethers, waffle } = require('hardhat');
const { expect } = require('chai');
const {
  collapseTextChangeRangesAcrossMultipleVersions,
} = require('typescript');

describe('MembershipNFT', () => {
  let membershipNFT, owner, addr1, addr2, addr3, vault;

  /* create named accounts for contract roles */

  before(async () => {
    /* before tests */
    [owner, addr1, addr2, addr3, vault] = await ethers.getSigners();
    const ERC721Factory = await ethers.getContractFactory('MembershipNFT');
    membershipNFT = await ERC721Factory.deploy(
      'Pillar DAO Membership',
      'PillarDAO'
    );
    await membershipNFT.deployed();
  });

  it('Deploys without errors', async () => {
    const _name = await membershipNFT.name();
    const _symbol = await membershipNFT.symbol();
    const _owner = await membershipNFT.owner();
    expect(_name).to.equal('Pillar DAO Membership');
    expect(_symbol).to.equal('PillarDAO');
    expect(_owner).to.equal(owner.address);
  });

  it('mint()', async () => {
    const tran = await membershipNFT.mint(addr2.address);
    const membershipId = await tran.wait();
    const tokenId = await membershipNFT.balanceOf(addr2.address);
    expect(membershipId.events.length).to.equal(2);
    expect(tokenId).to.equal(1);
  });

  it('Only vault should mint', async () => {
    const tran = membershipNFT.connect(addr2).mint(addr3.address);
    await expect(tran).to.be.revertedWith('MembershipNFT:: not the vault');
  });

  it('setBaseURI()', async () => {
    const tokenId = 1;
    const baseURI = 'ipfs://QmPSdB5ieVnPdmsj68ksAWV3ZmrLjr8ESLNVq6NpG8MsYg/';
    const beforeSet = await membershipNFT.tokenURI(tokenId);
    const tran = await membershipNFT.setBaseURI(baseURI);
    await tran.wait();
    const afterSet = await membershipNFT.tokenURI(tokenId);
    expect(beforeSet).to.not.equal(afterSet);
    expect(afterSet).to.equal(baseURI + tokenId);
  });

  it('Cannot Transfer', async () => {
    const tokenId = 1;
    const tran = membershipNFT
      .connect(addr2)
      .transferFrom(addr2.address, addr3.address, tokenId);
    await expect(tran).to.be.revertedWith('MembershipNFT:: not the vault');
  });

  it('Only vault should burn', async () => {
    const tokenId = 1;
    const tran = membershipNFT.connect(addr2).burn(tokenId);
    await expect(tran).to.be.revertedWith('MembershipNFT:: not the vault');
  });

  it('Only valid token can be burned', async () => {
    const tokenId = 0;
    const tran = membershipNFT.burn(tokenId);
    await expect(tran).to.be.revertedWith(
      'ERC721: owner query for nonexistent token'
    );
  });

  it('burn()', async () => {
    const tokenId = 1;
    const balanceBefore = await membershipNFT.balanceOf(addr2.address);
    expect(balanceBefore).to.equal(1);
    await membershipNFT.burn(tokenId);
    const balanceAfter = await membershipNFT.balanceOf(addr2.address);
    expect(balanceAfter).to.equal(0);
  });

  it('should increment token ids correctly, taking into account any burning', async () => {
    // mint addr1 an NFT
    const mint1 = await membershipNFT.mint(addr1.address);
    const memId1 = await mint1.wait();
    expect(memId1.events[0].args.tokenId).to.equal(2);

    // mint addr1 a second NFT
    const mint2 = await membershipNFT.mint(addr1.address);
    const memId2 = await mint2.wait();
    expect(memId2.events[0].args.tokenId).to.equal(3);

    // check addr1 balance for 2 NFTs
    expect(await membershipNFT.balanceOf(addr1.address)).to.equal(2);

    // burn NFT with token id of 2 and check balance of addr1
    await membershipNFT.burn(2);
    expect(await membershipNFT.balanceOf(addr1.address)).to.equal(1);

    // mint addr1 a third NFT and expect token id to equal 4
    const mint3 = await membershipNFT.mint(addr1.address);
    const memId3 = await mint3.wait();
    expect(memId3.events[0].args.tokenId).to.equal(4);
    expect(await membershipNFT.balanceOf(addr1.address)).to.equal(2);

    // burn NFT with token id of 3 and check balance of addr1
    await membershipNFT.burn(3);
    expect(await membershipNFT.balanceOf(addr1.address)).to.equal(1);

    // mint addr1 a fourth NFT and expect token id to equal 5
    const mint4 = await membershipNFT.mint(addr1.address);
    const memId4 = await mint4.wait();
    expect(memId4.events[0].args.tokenId).to.equal(5);
    expect(await membershipNFT.balanceOf(addr1.address)).to.equal(2);
  });
});
