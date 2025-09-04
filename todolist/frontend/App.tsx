import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { aptosClient } from "./utils/aptosClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Task = {
  address: string;
  completed: boolean;
  content: string;
  task_id: string;
};

function App() {
  const [newTask, setNewTask] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const { account, signAndSubmitTransaction } = useWallet();
  const [accountHasList, setAccountHasList] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const moduleAddress = "0x15e1f7e35246b8c68334e5e29f89766e18390948a695454b354bf16d967246d4";
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);

  // ---------------- Add new list ----------------
  const addNewList = async () => {
    if (!account) {
      setError("Please connect your wallet first");
      return;
    }
    
    setTransactionInProgress(true);
    setError(null);

    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::todolist::create_list`,
        functionArguments: [],
      },
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptosClient().waitForTransaction({ transactionHash: response.hash });
      setAccountHasList(true);
      await fetchList(); // Refresh the list after creation
    } catch (error: any) {
      setError(error.message || "Failed to create list");
      setAccountHasList(false);
    } finally {
      setTransactionInProgress(false);
    }
  };

  // ---------------- Add new task ----------------
  const onTaskAdded = async () => {
    if (!account) {
      setError("Please connect your wallet first");
      return;
    }
    
    if (!newTask.trim()) {
      setError("Task cannot be empty");
      return;
    }
    
    setTransactionInProgress(true);
    setError(null);

    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::todolist::create_task`,
        functionArguments: [newTask],
      },
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptosClient().waitForTransaction({ transactionHash: response.hash });
      
      // Instead of trying to predict the new task ID, refetch the list
      await fetchList();
      setNewTask("");
    } catch (error: any) {
      setError(error.message || "Failed to add task");
    } finally {
      setTransactionInProgress(false);
    }
  };

  // ---------------- Fetch tasks ----------------
  const fetchList = async () => {
    if (!account) {
      setTasks([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const todoListResource = await aptosClient().getAccountResource({
        accountAddress: account.address,
        resourceType: `${moduleAddress}::todolist::TodoList`,
      });

      setAccountHasList(true);

      const tableHandle = (todoListResource as any).tasks.handle;
      const taskCounter = parseInt((todoListResource as any).task_counter);

      let tasks: Task[] = [];
      
      // Fetch tasks in parallel for better performance
      const taskPromises = [];
      for (let counter = 1; counter <= taskCounter; counter++) {
        const tableItem = {
          key_type: "u64",
          value_type: `${moduleAddress}::todolist::Task`,
          key: `${counter}`,
        };

        taskPromises.push(
          aptosClient().getTableItem<Task>({
            handle: tableHandle,
            data: tableItem,
          })
        );
      }
      
      tasks = await Promise.all(taskPromises);
      setTasks(tasks);
    } catch (e: any) {
      // If resource doesn't exist, that's expected for new accounts
      if (e.status === 404) {
        setAccountHasList(false);
      } else {
        setError(e.message || "Failed to fetch tasks");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- Mark task as completed ----------------
  const onCheckboxChange = async (taskId: string) => {
    if (!account) {
      setError("Please connect your wallet first");
      return;
    }
    
    setTransactionInProgress(true);
    setError(null);

    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::todolist::complete_task`,
        functionArguments: [taskId],
      },
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptosClient().waitForTransaction({ transactionHash: response.hash });

      // Update local state optimistically
      setTasks(prevState =>
        prevState.map(obj =>
          obj.task_id === taskId ? { ...obj, completed: true } : obj
        )
      );
    } catch (error: any) {
      setError(error.message || "Failed to complete task");
    } finally {
      setTransactionInProgress(false);
    }
  };

  // ---------------- Load tasks when account changes ----------------
  useEffect(() => {
    fetchList();
  }, [account?.address]);

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Aptos Todo List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-md border bg-blue-50 text-blue-800 border-blue-200">
              <div className="text-sm">
                Please connect your wallet to use the Todo List app.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              Aptos Todo List
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <div className="p-4 rounded-md border bg-red-50 text-red-800 border-red-200 mb-4">
                <div className="text-sm">{error}</div>
              </div>
            )}
            
            {!accountHasList ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-lg mb-4 text-center">
                  You need to create a todo list before adding tasks.
                </p>
                <Button 
                  onClick={addNewList} 
                  disabled={transactionInProgress}
                  className="gap-2"
                >
                  {transactionInProgress ? (
                    <>
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Todo List
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Input for new task */}
                <div className="flex gap-2">
                  <Input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Write a new task..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') onTaskAdded();
                    }}
                    disabled={transactionInProgress}
                    className="flex-1"
                  />
                  <Button 
                    onClick={onTaskAdded} 
                    disabled={transactionInProgress || !newTask.trim()}
                    className="gap-2"
                  >
                    Add
                  </Button>
                </div>

                {/* Display tasks */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Your Tasks</h3>
                  
                  {isLoading ? (
                    // Loading placeholders
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 border rounded-md">
                        <div className="h-5 w-5 rounded bg-gray-200"></div>
                        <div className="h-5 flex-1 bg-gray-200"></div>
                      </div>
                    ))
                  ) : tasks.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      No tasks yet. Add your first task above!
                    </p>
                  ) : (
                    tasks.map((task) => (
                      <div 
                        key={task.task_id} 
                        className={`flex items-center justify-between p-3 border rounded-md transition-all ${
                          task.completed ? 'bg-green-50 border-green-200' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => onCheckboxChange(task.task_id)}
                            disabled={task.completed || transactionInProgress}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label
                            className={`flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}
                          >
                            {task.content}
                          </label>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;