import {useWallet,InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
//import { MODULE_ADDRESS } from "./constants";
import { aptosClient } from "./utils/aptosClient";
import { Button } from "@/components/ui/button";

type Task = {
  address: string;
  completed: boolean;
  content: string;
  task_id: string;
};

function App() {
  const tableHandle = (TodoListResource as any).data.tasks.handle;
  const taskCounter = (TodoListResource as any).data.task_counter;
  const [tasks, setTasks] = useState<Task[]>([]);
  const { account,signAndSubmitTransaction } = useWallet();
  const [accountHasList, setAccountHasList] = useState<boolean>(false);
  const moduleAddress = "0x15e1f7e35246b8c68334e5e29f89766e18390948a695454b354bf16d967246d4";
  const [transactionInProgress, setTransactionInProgress] =useState<boolean>(false);

  const fetchList = async () => {
  if (!account) return [];
  try {
    const todoListResource = await aptosClient().getAccountResource({
      accountAddress:account?.address,
      resourceType:`${moduleAddress}::todolist::TodoList`
    });
    setAccountHasList(true);
    // tasks table handle
    const tableHandle = (todoListResource as any).tasks.handle;
    // tasks table counter
    const taskCounter = (todoListResource as any).task_counter;

    let tasks = [];
    let counter = 1;
    while (counter <= taskCounter) {
      const tableItem = {
        key_type: "u64",
        value_type: `${moduleAddress}::todolist::Task`,
        key: `${counter}`,
      };
      const task = await aptosClient().getTableItem<Task>({handle:tableHandle, data:tableItem});
      tasks.push(task);
      counter++;
    }
    // set tasks in local state
    setTasks(tasks);
  } catch (e: any) {
    setAccountHasList(false);
  }
};

const addNewList = async () => {
  if (!account) return [];
  setTransactionInProgress(true);
  const transaction:InputTransactionData = {
      data: {
        function:`${moduleAddress}::todolist::create_list`,
        functionArguments:[]
      }
    }
  try {
    // sign and submit transaction to chain
    const response = await signAndSubmitTransaction(transaction);
    // wait for transaction
    await aptosClient().waitForTransaction({transactionHash:response.hash});
    setAccountHasList(true);
  } catch (error: any) {
    setAccountHasList(false);
  } finally {
    setTransactionInProgress(false);
  }
};


  return (
  <>
      {!accountHasList && (
        <div className="flex items-center justify-center flex-col">
          <Button onClick={addNewList} disabled={transactionInProgress}>
            Add new list
          </Button>
        </div>
      )}
  </>
);
}

export default App;