module gg_nft::gg_nft;

use sui::object::{Self, UID};
use sui::tx_context::TxContext;
use sui::transfer;
use sui::display;
use sui::package;
use std::string;
use sui::url;

// --- Error Constants ---
const EInvalidSkinType: u64 = 0;

// --- Valid Types Constants ---
const TYPE_ROCK: vector<u8> = b"Rock";
const TYPE_PAPER: vector<u8> = b"Paper";
const TYPE_SCISSORS: vector<u8> = b"Scissors";

public struct NFT has key, store {
    id: UID,
    name: string::String,
    description: string::String,
    image_url: url::Url,
    creator: address,
    gesture: string::String, 
}

public struct GG_NFT has drop {}

fun init(otw: GG_NFT, ctx: &mut TxContext) {
    let publisher = package::claim(otw, ctx);

    // Metadata fields
    let keys = vector[
        string::utf8(b"name"),
        string::utf8(b"description"),
        string::utf8(b"image_url"),
        string::utf8(b"gesture"),
    ];

    let values = vector[
        string::utf8(b"{name}"),
        string::utf8(b"{description}"),
        string::utf8(b"{image_url}"),
        string::utf8(b"{gesture}"),
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

public fun mint_nft(
    name: vector<u8>,
    description: vector<u8>,
    image_url: vector<u8>,
    gesture: vector<u8>,
    ctx: &mut TxContext
) {
    let nft = NFT {
        id: object::new(ctx),
        name: string::utf8(name),
        description: string::utf8(description),
        image_url: url::new_unsafe_from_bytes(image_url),
        creator: ctx.sender(),
        gesture: string::utf8(gesture),
    };

    transfer::public_transfer(nft, ctx.sender());
}