#[test_only]
module todolist_addr::todolist_test {
    use todolist_addr::todolist;
    use std::string;

    #[test(admin = @0x123)]
    public fun test_flow(admin: signer) {
        // Create the todo list first
        todolist::create_list(&admin);
        
        // Create a task
        let task_content = string::utf8(b"Learn Move programming");
        todolist::create_task(&admin, task_content);
        
        // Complete the task
        todolist::complete_task(&admin, 1);
        
        // Test passed if no errors occurred
    }

    #[test(admin = @0x123)]
    public fun test_create_multiple_tasks(admin: signer) {
        // Create the todo list
        todolist::create_list(&admin);
        
        // Create multiple tasks
        todolist::create_task(&admin, string::utf8(b"Task 1"));
        todolist::create_task(&admin, string::utf8(b"Task 2"));
        todolist::create_task(&admin, string::utf8(b"Task 3"));
        
        // Complete some tasks
        todolist::complete_task(&admin, 1);
        todolist::complete_task(&admin, 3);
    }

    #[expected_failure(abort_code = 1)] // Assuming you add error handling
    #[test(admin = @0x123)]
    public fun test_complete_nonexistent_task(admin: signer) {
        todolist::create_list(&admin);
        // Try to complete a task that doesn't exist
        todolist::complete_task(&admin, 999);
    }
}