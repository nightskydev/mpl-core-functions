use anchor_lang::prelude::*;
use anchor_spl::token::{
    self, spl_token::instruction::AuthorityType, CloseAccount, Mint, SetAuthority, Token,
    TokenAccount, Transfer,
};

#[derive(Accounts)]
pub struct InitializeAdmin<'info> {
    #[account(
        init,
        payer = payer,
        seeds = [b"vault", treasury.key().as_ref()],
        bump,
        space = 8 + 32 // 8 for anchor discriminator, 32 for treasury pubkey (expand as needed)
    )]
    pub vault: AccountInfo<'info, TokenAccount>,

    /// CHECK: This is the treasury wallet that will receive rewards
    pub treasury: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct InitializeAdminArgs {
    pub name: String,
    pub uri: String,
}

impl<'info> InitializeAdmin<'info> {
    pub fn handler(ctx: Context<InitializeAdmin>, args: InitializeAdminArgs) -> Result<()> {
        

        Ok(())
    }
}
