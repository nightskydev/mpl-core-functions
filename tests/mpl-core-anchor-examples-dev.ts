import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MplCoreAnchorWrapper } from "../target/types/mpl_core_anchor_wrapper";
import {
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  createMint,
  mintTo,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as assert from "assert";
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

  it("Can create an Asset with Vault PDA & Staking test", async () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const connection = anchor.getProvider().connection;
    // Generate keypairs
    // const mint = anchor.web3.Keypair.generate();
    const treasury = anchor.web3.Keypair.generate();
    const user = anchor.web3.Keypair.generate();

    // Derive PDAs
    const [vaultPda, _] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    );
    const [adminStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("state"), Buffer.from("admin")],
      program.programId
    );

    // Airdrop SOL to payer and treasury
    const payer = provider.wallet.publicKey;

    let airdropSig = await connection.requestAirdrop(
      payer,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSig, "confirmed");
    airdropSig = await connection.requestAirdrop(
      user.publicKey,
      anchor.web3.LAMPORTS_PER_SOL * 100
    );
    await connection.confirmTransaction(airdropSig, "confirmed");
    airdropSig = await connection.requestAirdrop(
      treasury.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSig, "confirmed");

    // // Create mint account
    // const mintRent = await connection.getMinimumBalanceForRentExemption(82);
    // const createMintIx = anchor.web3.SystemProgram.createAccount({
    //   fromPubkey: payer,
    //   newAccountPubkey: mint.publicKey,
    //   space: 82,
    //   lamports: mintRent,
    //   programId: TOKEN_PROGRAM_ID,
    // });
    // const initMintIx = createInitializeMintInstruction(
    //   mint.publicKey,
    //   0,
    //   payer,
    //   null
    // );
    // const txMint = new anchor.web3.Transaction().add(createMintIx, initMintIx);
    // await provider.sendAndConfirm(txMint, [mint]);

    const mint = await createMint(
      provider.connection,
      user,
      user.publicKey,
      null,
      0
    );

    // Token accounts
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user, // payer
      mint,
      user.publicKey
    );
    // const escrowTokenAccount = await getOrCreateAssociatedTokenAccount(
    //   provider.connection,
    //   owner,
    //   mint,
    //   collection.publicKey // using collection as escrow owner for PDA
    // );
    // const feeTokenAccount = await getOrCreateAssociatedTokenAccount(
    //   provider.connection,
    //   owner,
    //   mint,
    //   feeProjectAccount.publicKey
    // );

    console.log(
      user,
      mint,
      userTokenAccount.address,
      anchor.getProvider().publicKey
    );
    // Mint tokens to user
    await mintTo(
      provider.connection,
      user,
      mint,
      userTokenAccount.address,
      user,
      100
    );

    // Call initializeAdmin
    await program.methods
      .initializeAdmin({
        riskBasedApy: [1, 2, 3], // Example APY values
        stakingPeriodRange: [
          new anchor.BN(60 * 60 * 24),
          new anchor.BN(60 * 60 * 24 * 365),
        ], // 1 day to 30 days
        withdrawAvailableAfter: new anchor.BN(60 * 60 * 24 * 7), // 7 days
      })
      .accountsPartial({
        mint: mint,
        vault: vaultPda,
        adminState: adminStatePda,
        treasury: treasury.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([])
      .rpc();

    // Fetch and check AdminState
    const adminState = await program.account.adminState.fetch(adminStatePda);
    assert.deepEqual(adminState.riskBasedApy, [1, 2, 3]);
    assert.deepEqual(
      adminState.stakingPeriodRange.map((x: anchor.BN) => x.toNumber()),
      [60 * 60 * 24, 60 * 60 * 24 * 365]
    );
    assert.equal(
      adminState.withdrawAvailableAfter.toNumber(),
      60 * 60 * 24 * 7
    );
    assert.ok(adminState.tokenMint.equals(mint));
    assert.ok(adminState.admin.equals(payer));
    assert.ok(adminState.treasury.equals(treasury.publicKey));
    console.log("AdminState:", adminState);

    const umi = createUmi(
      // "https://stylish-thrilling-model.solana-devnet.quiknode.pro/4c04763b7094cc438662f16acda78bc32df10f00",
      "http://127.0.0.1:8899",
      "processed"
    ).use(mplCore());

    // const asset = generateSigner(umi);
    const asset = anchor.web3.Keypair.generate();

    // find asset signer PDA
    const assetSignerPda = findAssetSignerPda(umi, {
      asset: publicKey(asset.publicKey.toString()),
    });

    // Get balances before
    const assetSignerPubkey = new anchor.web3.PublicKey(
      assetSignerPda[0].toString()
    );
    const payerBalanceBefore = await connection.getBalance(payer);

    const lamportsToSend = 1_000_000;

    const assetSignerBalanceBefore = await connection.getBalance(
      assetSignerPubkey
    );

    const treasuryAirdropSig = await connection.requestAirdrop(
      treasury.publicKey,
      1_000_000_000 // 1 SOL
    );
    await connection.confirmTransaction(treasuryAirdropSig, "confirmed");

    // create collection
    const collection = anchor.web3.Keypair.generate();
    console.log("////////////////////////////////////////");
    // Add your test here.
    const createCollectionTx = await program.methods
      .createCollectionV1({
        name: "Hello Anchor!",
        uri: "www.example.com",
        plugins: [],
      })
      .accountsPartial({
        collection: collection.publicKey,
        adminState: adminStatePda,
        admin: anchor.getProvider().publicKey,
      })
      .signers([collection])
      .rpc();
    console.log("Your transaction signature", createCollectionTx);

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
        collection: collection.publicKey,
        assetSigner: assetSignerPubkey,
        payer: user.publicKey,
        owner: null,
        updateAuthority: null,
        logWrapper: null,
      })
      .signers([asset, user])
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

    let instruction = SystemProgram.transfer({
      fromPubkey: assetSignerPubkey,
      toPubkey: treasury.publicKey,
      lamports: 0.1 * LAMPORTS_PER_SOL, // 0.1 SOL each
    });

    let instructionData = instruction.data;

    // await wait(5000);
    // staking test
    const stakingTx = await program.methods
      .stake({
        stakingPeriod: new anchor.BN(86400 * 100),
        riskType: 0,
        instructionData,
      })
      .accountsPartial({
        owner: user.publicKey,
        updateAuthority: adminStatePda,
        collection: collection.publicKey,
        payer: user.publicKey,
        asset: asset.publicKey,
        assetSigner: assetSignerPubkey,
        coreProgram: MPL_CORE_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log(stakingTx);

    const assetInfo = await fetchAsset(umi, asset.publicKey.toString());
    // console.log("Asset:", assetInfo);

    // Attributes are usually stored in plugins, so:
    console.log("Attributes:", assetInfo.attributes);

    //init escrow
    const feeLocation = anchor.web3.Keypair.generate();

    // Derive escrow PDA
    const [escrowPda, escrowBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), collection.publicKey.toBuffer()],
        program.programId
      );

    // Derive fee ATA
    const feeAta = await anchor.utils.token.associatedAddress({
      mint: mint,
      owner: feeLocation.publicKey,
    });
    // const feeAta = anchor.utils.token.associatedAddress({
    //   mint: mint.publicKey,
    //   owner: feeLocation.publicKey,
    // });

    // Prepare ix data
    const ix = {
      name: "Test Escrow",
      uri: "https://example.com/escrow",
      max: new anchor.BN(1000),
      min: new anchor.BN(10),
      amount: new anchor.BN(100),
      feeAmount: new anchor.BN(5),
      solFeeAmount: new anchor.BN(10000),
      path: 1,
    };

    await program.methods
      .initEscrowV1(ix)
      .accountsPartial({
        escrow: escrowPda,
        admin: anchor.getProvider().publicKey,
        adminState: adminStatePda,
        collection: collection.publicKey,
        token: mint,
        feeLocation: feeLocation.publicKey,
        feeAta: feeAta,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([])
      .rpc({ skipPreflight: true });

    // Fetch and check escrow account
    const escrowAccount = await provider.connection.getAccountInfo(escrowPda);
    // assert.ok(escrowAccount !== null, "Escrow account should exist");
    console.log("Escrow account data:", escrowAccount);

    // // release
    // await program.methods
    //   .releaseV1()
    //   .accountsPartial({
    //     owner: user.publicKey,
    //     authority: adminStatePda,
    //     escrow: escrowPda,
    //     asset: asset.publicKey,
    //     collection: collection.publicKey,
    //     userTokenAccount: userTokenAccount.address,
    //     escrowTokenAccount: escrowTokenAccount.address,
    //     token: mint,
    //     feeTokenAccount: feeTokenAccount.address,
    //     feeSolAccount: feeSolAccount.publicKey,
    //     feeProjectAccount: feeProjectAccount.publicKey,
    //     recentBlockhashes: recentBlockhashes,
    //     mplCore: mplCore,
    //     systemProgram: SystemProgram.programId,
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //     associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    //   })
    //   .signers([owner, authority])
    //   .rpc();

    // // Fetch and check user token account balance
    // const userTokenAcc = await connection.getTokenAccountBalance(
    //   userTokenAccount.address
    // );
    // assert.ok(
    //   Number(userTokenAcc.value.amount) > 0,
    //   "User should have received tokens"
    // );
    // console.log("User token account balance:", userTokenAcc.value.amount);
  });
});
