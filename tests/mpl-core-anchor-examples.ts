import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MplCoreAnchorWrapper } from "../target/types/mpl_core_anchor_wrapper";
import {
  createV1,
  createV2,
  mplCore,
  execute,
  fetchAssetV1,
  transferV1,
  fetchAsset,
  fetchCollection,
  createCollectionV1,
  createCollectionV2,
  getAssetV1GpaBuilder,
  findAssetSignerPda,
  MPL_CORE_PROGRAM_ID,
  Key,
  collectionAddress,
  updateAuthority,
  pluginAuthorityPair,
  ruleSet,
} from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  TransactionBuilderSendAndConfirmOptions,
  generateSigner,
  signerIdentity,
  keypairIdentity,
  createNoopSigner,
  sol,
  publicKey,
} from "@metaplex-foundation/umi";

// Helpers
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("mpl-core-anchor-examples", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .MplCoreAnchorWrapper as Program<MplCoreAnchorWrapper>;

  // it("Can create an Asset", async () => {
  //   const asset = anchor.web3.Keypair.generate();
  //   // Add your test here.
  //   const tx = await program.methods
  //     .createV1({
  //       name: "Hello Anchor!",
  //       uri: "www.example.com",
  //       plugins: null,
  //     })
  //     .accounts({
  //       asset: asset.publicKey,
  //       collection: null,
  //       payer: anchor.getProvider().publicKey,
  //       owner: null,
  //       updateAuthority: null,
  //       logWrapper: null,
  //     })
  //     .signers([asset])
  //     .rpc();
  //   console.log("Your transaction signature", tx);
  // });

  it("Can create an Asset with Vault PDA & Staking test", async () => {
    const umi = createUmi(
      "https://stylish-thrilling-model.solana-devnet.quiknode.pro/4c04763b7094cc438662f16acda78bc32df10f00",
      "processed"
    ).use(mplCore());

    // const asset = generateSigner(umi);
    const asset = anchor.web3.Keypair.generate();
    const treasury = new anchor.web3.PublicKey(
      "kVnzBpks8vo2cMqoRaiyq8ZvENMua9BZWZyxkUCEJnj"
    );
    // find asset signer PDA
    const assetSignerPda = findAssetSignerPda(umi, {
      asset: publicKey(asset.publicKey.toString()),
    });

    // Get balances before
    const connection = anchor.getProvider().connection;
    const payer = anchor.getProvider().publicKey;
    const assetSignerPubkey = new anchor.web3.PublicKey(
      assetSignerPda[0].toString()
    );
    const payerBalanceBefore = await connection.getBalance(payer);

    const lamportsToSend = 1_000_000;

    const assetSignerBalanceBefore = await connection.getBalance(
      assetSignerPubkey
    );

    // const treasuryAirdropSig = await connection.requestAirdrop(
    //   treasury,
    //   1_000_000_000 // 1 SOL
    // );
    // await connection.confirmTransaction(treasuryAirdropSig, "confirmed");

    // create collection
    // const collection = anchor.web3.Keypair.generate();
    // // Add your test here.
    // const createCollectionTx = await program.methods
    //   .createCollectionV1({
    //     name: "Hello Anchor!",
    //     uri: "www.example.com",
    //     plugins: [],
    //   })
    //   .accounts({
    //     collection: collection.publicKey,
    //     payer: anchor.getProvider().publicKey,
    //     updateAuthority: null,
    //   })
    //   .signers([collection])
    //   .rpc();
    // console.log("Your transaction signature", createCollectionTx);

    // Add your test here.
    const tx = await program.methods
      .createV1WithVaultPda({
        name: "Hello Anchor!",
        uri: "https://arweave.net/JqFHoOxGvoeXCXqgSNtSLI4xw5hVruidRfBSZE1Jvvo/29.json",
        plugins: null,
        lamports: new anchor.BN(lamportsToSend),
        nftType: 1, // 1 = 4% fee, 0 = 5% fee
      })
      .accounts({
        asset: asset.publicKey,
        collection: publicKey("8sSeoStcSbDRmGKpLy4hiddDuuCTBSRkBsMJjCGK1S4C"),
        assetSigner: assetSignerPubkey,
        payer: anchor.getProvider().publicKey,
        owner: null,
        updateAuthority: null,
        treasury: treasury,
        logWrapper: null,
      })
      .signers([asset])
      .rpc();
    console.log("asset publickey ", asset.publicKey.toString());

    // Get balances after
    const payerBalanceAfter = await connection.getBalance(payer);
    const assetSignerBalanceAfter = await connection.getBalance(
      assetSignerPubkey
    );

    // Check the difference
    console.log("Payer diff:", payerBalanceBefore - payerBalanceAfter);
    console.log(
      "Asset signer diff:",
      assetSignerBalanceAfter - assetSignerBalanceBefore
    );

    if (assetSignerBalanceAfter - assetSignerBalanceBefore !== lamportsToSend) {
      throw new Error(
        "SOL was not transferred correctly to the asset signer PDA"
      );
    }

    console.log("Your transaction signature", tx);

    await wait(5000);
    // staking test
    const stakingTx = await program.methods
      .stake({
        name: "Hello Anchor!",
        uri: "https://arweave.net/JqFHoOxGvoeXCXqgSNtSLI4xw5hVruidRfBSZE1Jvvo/29.json",
        plugins: null,
        lamports: new anchor.BN(lamportsToSend),
        nftType: 1, // 1 = 4% fee, 0 = 5% fee
      })
      .accountsPartial({
        owner: anchor.getProvider().publicKey,
        updateAuthority: anchor.getProvider().publicKey,
        payer: anchor.getProvider().publicKey,
        asset: asset.publicKey,
        collection: publicKey("8sSeoStcSbDRmGKpLy4hiddDuuCTBSRkBsMJjCGK1S4C"),
        coreProgram: MPL_CORE_PROGRAM_ID,
      })
      .signers([])
      .rpc();

    console.log(stakingTx);
  });

  // it("Can create a Collection", async () => {
  //   const collection = anchor.web3.Keypair.generate();
  //   // Add your test here.
  //   const tx = await program.methods
  //     .createCollectionV1({
  //       name: "Hello Anchor!",
  //       uri: "www.example.com",
  //       plugins: [],
  //     })
  //     .accounts({
  //       collection: collection.publicKey,
  //       payer: anchor.getProvider().publicKey,
  //       updateAuthority: null,
  //     })
  //     .signers([collection])
  //     .rpc();
  //   console.log("Your transaction signature", tx);
  // });

  // it("Can transfer an Asset", async () => {
  //   const asset = anchor.web3.Keypair.generate();
  //   // Add your test here.
  //   await program.methods
  //     .createV1({
  //       name: "Hello Anchor!",
  //       uri: "www.example.com",
  //       plugins: null,
  //     })
  //     .accounts({
  //       asset: asset.publicKey,
  //       collection: null,
  //       payer: anchor.getProvider().publicKey,
  //       owner: null,
  //       updateAuthority: null,
  //       logWrapper: null,
  //     })
  //     .signers([asset])
  //     .rpc();

  //   const tx = await program.methods
  //     .transferV1({})
  //     .accounts({
  //       asset: asset.publicKey,
  //       collection: null,
  //       payer: anchor.getProvider().publicKey,
  //       newOwner: anchor.web3.Keypair.generate().publicKey,
  //       systemProgram: null,
  //       logWrapper: null,
  //     })
  //     .rpc();
  //   console.log("Your transaction signature", tx);
  // });
});
