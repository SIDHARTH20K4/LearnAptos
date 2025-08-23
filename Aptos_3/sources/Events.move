module Events::message {
    use std::signer;
    use std::string;
    use 0x1::event;

    #[event]
    struct MessageSetEvent has drop, store {
        sender: address,
        length: u64
    }

    struct MessageHolder has key, drop, store {
        message: string::String,
    }

    public entry fun set_message(account: &signer, msg: string::String) acquires MessageHolder {
        let addr = signer::address_of(account);

        if (exists<MessageHolder>(addr)) {
            move_from<MessageHolder>(addr);
        };

        let evt: MessageSetEvent = MessageSetEvent {
            sender: addr,
            length: string::length(&msg),
        };

        event::emit<MessageSetEvent>(evt);

        move_to(account, MessageHolder { message: msg });
    }

    #[view]
    public fun get_message(addr: address): string::String acquires MessageHolder {
        assert!(exists<MessageHolder>(addr), 0);
        borrow_global<MessageHolder>(addr).message
    }
}