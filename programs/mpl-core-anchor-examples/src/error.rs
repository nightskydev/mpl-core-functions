use anchor_lang::prelude::*;

#[error_code]
pub enum WrapperError {
    #[msg("Invalid plugin type")]
    InvalidPluginType,
    #[msg("Invalid asset signer pda")]
    InvalidExecutePda,
    #[msg("Insufficient funds to pay")]
    InsufficientFunds,
    #[msg("Invaild NFT type")]
    InvalidNftType,
    #[msg("Invalid owner")]
    OwnerMismatched,
    #[msg("Invalid timestamp")]
    InvalidTimestamp,
    #[msg("Already staked")]
    AlreadyStaked,
    #[msg("Not staked")]
    NotStaked,
    #[msg("Staking not initialized")]
    StakingNotInitialized,
    #[msg("Attributes not initialized")]
    AttributesNotInitialized,
    #[msg("Underflow")]
    Underflow,
    #[msg("Overflow")]
    Overflow,
    #[msg("Staking period is out of allowed range")]
    InvalidStakingPeriod,
}
