module token_locker::locker {
    use std::signer;
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::timestamp;

    struct Lock has store {
        amount: u64,
        unlock_time: u64,
    }

    struct LockerStore has key {
        locks: vector<Lock>,
    }

    /// Initialize the locker (call once per account)
    public entry fun init(account: &signer) {
        coin::register<AptosCoin>(account); // Register AptosCoin capability
        move_to(account, LockerStore {
            locks: vector::empty<Lock>(),
        });
    }

    /// Lock tokens until `unlock_time` (epoch seconds)
    public entry fun lock_tokens(
        account: &signer,
        amount: u64,
        unlock_time: u64,
    ) acquires LockerStore {
        assert!(amount > 0, 1); // Amount must be positive
        let user_addr = signer::address_of(account);
        let now = timestamp::now_seconds();
        assert!(unlock_time > now, 2); // Unlock time must be in future

        // Withdraw tokens from user
        let coins = coin::withdraw<AptosCoin>(account, amount);

        // Initialize store if missing
        if (!exists<LockerStore>(user_addr)) {
            move_to(account, LockerStore { locks: vector::empty() });
        };

        // Add new lock
        let store = borrow_global_mut<LockerStore>(user_addr);
        vector::push_back(&mut store.locks, Lock { amount, unlock_time });
    }

    /// Withdraw all unlocked tokens
    public entry fun withdraw(account: &signer) acquires LockerStore {
        let user_addr = signer::address_of(account);
        let now = timestamp::now_seconds();
        let store = borrow_global_mut<LockerStore>(user_addr);
        let total_to_withdraw = 0;
        let i = 0;

        // Check each lock
        while (i < vector::length(&store.locks)) {
            let lock = vector::borrow(&store.locks, i);
            if (lock.unlock_time <= now) {
                total_to_withdraw = total_to_withdraw + lock.amount;
                vector::remove(&mut store.locks, i);
            } else {
                i = i + 1;
            };
        };

        // Withdraw unlocked amount
        if (total_to_withdraw > 0) {
            let coins = coin::withdraw<AptosCoin>(user_addr, total_to_withdraw);
            coin::deposit<AptosCoin>(user_addr, coins);
        };
    }
}