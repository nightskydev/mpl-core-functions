use crate::error::MplHybridError;
use anchor_lang::prelude::*;
use solana_program::{pubkey, pubkey::Pubkey, rent::Rent, sysvar::Sysvar};

pub const FEE_WALLET: Pubkey = pubkey!("C3iyKknpNPeZXQEVLkR8ZJxcgB8xdsqXkyrV1RwEmdrD");
pub const SLOT_HASHES: Pubkey = pubkey!("SysvarS1otHashes111111111111111111111111111");
pub const MPL_CORE: Pubkey = pubkey!("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

const PROTOCOL_FEE_SCALAR: usize = 590;
const PROTOCOL_FEE_OFFSET: u64 = 2_720;
pub fn get_protocol_fee() -> Result<u64> {
    let rent = Rent::get()?.minimum_balance(PROTOCOL_FEE_SCALAR);

    Ok(rent
        .checked_add(PROTOCOL_FEE_OFFSET)
        .ok_or(MplHybridError::NumericalOverflow)?)
}


#[constant]
pub const SEED: &str = "anchor";
