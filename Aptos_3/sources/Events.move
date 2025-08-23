module Events::message {
    use std::signer;
    use std:: string;
    use 0x1:: Event;

    #[event]
    struct MessageEvent has drop, store {
        sender: address,
        length: u64
    }

    struct MessageHolder has key, drop, store {
        message : string::String,
    }
}