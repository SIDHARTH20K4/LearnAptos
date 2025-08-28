module todolist_addr::todolist {

    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use std::string::String;
    use aptos_std::table::{Self, Table};

    struct TodoList has key {
        tasks: Table<u64, Task>,  
        set_task_event: EventHandle<Task>,
        task_counter: u64
    }

    struct Task has store, drop, copy {
        task_id: u64,
        address: address,
        content: String,
        completed: bool,
    }

    public entry fun create_list(account: &signer) {
        let task_holder = TodoList {
            tasks: table::new(),
            set_task_event: account::new_event_handle<Task>(account),  // This should work now
            task_counter: 0
        };

        move_to(account, task_holder);
    }
}