export enum NftOp {
    Transfer = 0x5fcc3d14,
    OwnershipAssigned = 0x05138d91,
    Excesses = 0xd53276db,
    GetStaticData = 0x2fcb26a2,
    ReportStaticData = 0x8b771735,
    GetRoyaltyParams = 0x693d3950,
    ReportRoyaltyParams = 0xa8cb00ad,

    // NFTEditable
    EditContent = 0x1a0b9d51,
    TransferEditorship = 0x1c04412a,
    EditorshipAssigned = 0x511a4463,

    // Minting
    Mint = 0x249cbfa1,
    BatchMint = 0x7362d09c,
    ChangeAdmin = 0x26aa0f46,
}
