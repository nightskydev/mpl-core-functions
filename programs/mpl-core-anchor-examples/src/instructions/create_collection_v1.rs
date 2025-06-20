use anchor_lang::prelude::*;
use mpl_core::types::PluginAuthorityPair;
use crate::state::*;

#[derive(Accounts)]
pub struct CreateCollectionV1<'info> {
    /// The address of the new asset.
    #[account(mut)]
    pub collection: Signer<'info>,

    #[account(
        seeds = [b"state".as_ref(), b"admin".as_ref()],
        bump,
        has_one = admin,
    )]
    pub admin_state: Box<Account<'info, AdminState>>,

    // /// The authority on the new asset.
    // /// CHECK: Checked in mpl-core.
    // pub update_authority: Option<AccountInfo<'info>>,

    /// The account paying for the storage fees.
    #[account(mut)]
    pub admin: Signer<'info>,

    /// The system program.
    pub system_program: Program<'info, System>,

    /// The MPL Core program.
    /// CHECK: Checked in mpl-core.
    #[account(address = mpl_core::ID)]
    pub mpl_core: AccountInfo<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateCollectionV1Args {
    pub name: String,
    pub uri: String,
    pub plugins: Option<Vec<PluginAuthorityPair>>,
}

impl<'info> CreateCollectionV1<'info> {
    pub fn handler(ctx: Context<CreateCollectionV1>, args: CreateCollectionV1Args) -> Result<()> {
        mpl_core::instructions::CreateCollectionV1Cpi {
            collection: ctx.accounts.collection.as_ref(),
            payer: &ctx.accounts.admin.to_account_info(),
            update_authority: Some(ctx.accounts.admin_state.to_account_info().as_ref()),
            system_program: &ctx.accounts.system_program.to_account_info(),
            __program: &ctx.accounts.mpl_core,
            __args: mpl_core::instructions::CreateCollectionV1InstructionArgs {
                name: args.name,
                uri: args.uri,
                plugins: args.plugins,
            },
        }
        .invoke()?;

        Ok(())
    }
}
