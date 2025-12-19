module gg_nft::gg_nft;

use sui::object::{Self, UID};
use sui::tx_context::TxContext;
use sui::transfer;
use sui::display;
use sui::package;
use std::string;
use sui::url;

// NFT struct chuẩn Slush Wallet
public struct NFT has key, store {
    id: UID,
    name: string::String,
    description: string::String,
    image_url: url::Url,
    creator: address,
}

// One-time witness
public struct GG_NFT has drop {}

/// init – chạy 1 lần khi publish
fun init(otw: GG_NFT, ctx: &mut TxContext) {
    // Claim publisher
    let publisher = package::claim(otw, ctx);

    // Metadata fields cho wallet
    let keys = vector[
        string::utf8(b"name"),
        string::utf8(b"description"),
        string::utf8(b"image_url"),
    ];

    let values = vector[
        string::utf8(b"{name}"),
        string::utf8(b"{description}"),
        string::utf8(b"{image_url}"),
    ];

    let mut display = display::new_with_fields<NFT>(
        &publisher,
        keys,
        values,
        ctx
    );

    display::update_version(&mut display);

    transfer::public_transfer(publisher, ctx.sender());
    transfer::public_transfer(display, ctx.sender());
}


/// Mint NFT cho address chỉ định (Slush wallet)
public fun mint_nft_to(
    recipient: address,
    name: vector<u8>,
    description: vector<u8>,
    image_url: vector<u8>,
    ctx: &mut TxContext
) {
    let nft = NFT {
        id: object::new(ctx),
        name: string::utf8(name),
        description: string::utf8(description),
        image_url: url::new_unsafe_from_bytes(image_url),
        creator: ctx.sender(),
    };

    transfer::public_transfer(nft, recipient);
}



// sui client call `
//   --package 0x1bda5ec5dda87f86896b45e95e12636e4fbbf58562b81a3fbfb8426589e13e5c `
//   --module gg_nft `
//   --function mint_nft_to `
//   --args `
//     0xc53a25982a001b324cbe2a87e66f4a0414f173667c727f67820410d007ef2661 `
//     "UltraStone" `
//     "Rock" `
//     "https://azure-urgent-stork-985.mypinata.cloud/ipfs/bafybeifkhacg2tj2m6ljrt4rlktbt6p67tigzcvnrbwfx6ygczbxrrooai" `
//   --gas-budget 5000000