// use super::utils::{load_acc_mut_unchecked, DataLen, Initialized};
// use pinocchio::{
//     account_info::AccountInfo,
//     program_error::ProgramError,
//     pubkey::{self, Pubkey},
//     ProgramResult,
// };

// use crate::{
//     error::MyProgramError,
//     instruction::{InitializeMyStateIxData, UpdateMyStateIxData},
// };

// #[repr(u8)]
// #[derive(Clone, Copy, Debug, PartialEq)]
// pub enum State {
//     Uninitialized,
//     Initialized,
//     Updated,
// }

// #[account]
// pub struct AdminState {
//     pub risk_based_apy: [u8; 3], // 0 = low risk, 1 = medium risk, 2 = high risk
//     pub staking_period_range: [u64; 2], // in seconds
//     pub withdraw_available_after: u64, // in seconds
//     // The mint of the token used for staking rewards
//     pub token_mint: Pubkey,
//     pub admin: Pubkey,
//     pub treasury: Pubkey,
// }

// impl AdminState {
//     pub fn space() -> usize {
//         8 + 3 + 8 * 2 + 8 + 32 + 32 + 32
//     }
// }

// impl<'info> InitializeAdmin<'info> {
//     pub fn handler(ctx: Context<InitializeAdmin>, args: InitializeAdminArgs) -> Result<()> {
//         let admin_state = &mut ctx.accounts.admin_state;
//         admin_state.risk_based_apy = args.risk_based_apy; // Set default APY values as needed
//         admin_state.staking_period_range = args.staking_period_range; // Set default staking period range
//         admin_state.withdraw_available_after = args.withdraw_available_after; // Set default withdraw available after time
//         // Set the token mint, admin, and treasury addresses
//         admin_state.token_mint = ctx.accounts.mint.key();
//         admin_state.admin = ctx.accounts.initializer.key();
//         admin_state.treasury = ctx.accounts.treasury.key();
//         Ok(())
//     }
// }
