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
}
