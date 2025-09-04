module todolist_addr::todolist {
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use std::string::String;
    use aptos_std::table::{Self, Table};
    use std::signer;  

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
            set_task_event: account::new_event_handle<Task>(account),
            task_counter: 0
        };
        move_to(account, task_holder);
    }

    public entry fun create_task(account: &signer, content: String) acquires TodoList {
        let signer_address = signer::address_of(account);
        assert!(exists<TodoList>(signer_address), 1);

        let todo_list = borrow_global_mut<TodoList>(signer_address);
        let counter = todo_list.task_counter + 1;

        let new_task = Task {
            task_id: counter,
            address: signer_address,
            content,
            completed: false
        };

        // Update counter first
        todo_list.task_counter = counter;

        // Add task to table
        table::upsert(&mut todo_list.tasks, counter, new_task);

        // Emit event - FIXED: Don't borrow global again!
        event::emit_event<Task>(
            &mut todo_list.set_task_event,  // Use existing reference
            new_task,
        );
    }

    public entry fun complete_task(account: &signer, task_id: u64) acquires TodoList {
        let signer_address = signer::address_of(account);
        assert!(exists<TodoList>(signer_address), 2);
        
        let todo_list = borrow_global_mut<TodoList>(signer_address);
        assert!(table::contains(&todo_list.tasks, task_id), 3);
        
        let task_record = table::borrow_mut(&mut todo_list.tasks, task_id);
        task_record.completed = true;
    }

    // Add a view function to check tasks (doesn't cost gas to read)
    #[view]
    public fun get_task(task_list_owner: address, task_id: u64): Task acquires TodoList {
        let todo_list = borrow_global<TodoList>(task_list_owner);
        *table::borrow(&todo_list.tasks, task_id)
    }

    #[view] 
    public fun get_task_count(task_list_owner: address): u64 acquires TodoList {
        let todo_list = borrow_global<TodoList>(task_list_owner);
        todo_list.task_counter
    }
}