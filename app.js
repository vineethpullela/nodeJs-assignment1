const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns");

app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const todoApplicationDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3007, () => {
      console.log("Server Running at http://localhost:3007");
    });
  } catch (e) {
    console.log(`DB error ${e.message}`);
  }
};

todoApplicationDbServer();
module.exports = app;

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

//API 1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, todo, category } = request.query;

  switch (true) {
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        priority = '${priority}';`;
      break;

    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasCategoryAndStatus(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM
          todo
        WHERE 
        category = '${category}'
        AND status LIKE '${status}';
        `;
      break;
    case hasCategoryAndPriority(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM
          todo
        WHERE 
        category = '${category}'
        AND priority = '${priority}';
        `;
      break;

    case hasCategory(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM
          todo
        WHERE 
        category ='${category}';`;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  const responseDb = data.map((todo) => {
    return {
      id: todo.id,
      todo: todo.todo,
      priority: todo.priority,
      status: todo.status,
      category: todo.category,
      dueDate: todo.due_date,
    };
  });
  response.send(responseDb);
});

//API 1

/*app.get("/todos/", async (request, response) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = request.query;
  const getListQuery = `select * from todo where status like '%${status}%' and priority like '%${priority}%' and category like '%${category}$' and todo like '%${search_q}%';`;

  const listArray = await db.all(getListQuery);
  response.send(listArray);
});*/

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const newDate = format(new Date(2021 - 12 - 12), "yyyy-MM-dd");
  console.log(newDate);

  const getTodosQuery = `
    select 
        * 
    from
        todo
    where
        due_date like ${newDate};`;

  const listArray = db.all(getTodosQuery);
  response.send(listArray);
});

//API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo,category, priority, status,due_date)
  VALUES
    (${id}, '${todo}', '${category}','${priority}', '${status}','${dueDate}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let requestBody = request.body;
  //console.log(requestBody.todo);
  //const { status = "", priority = "", todo = "" } = request.body;
  //console.log(status);
  let updated = "";
  switch (true) {
    case requestBody.status !== undefined:
      updated = "Status";
      break;
    case requestBody.priority !== undefined:
      updated = "Priority";
      break;
    case requestBody.todo !== undefined:
      updated = "Todo";
      break;
    case requestBody.category !== undefined:
      updated = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updated = "Due Date";
      break;
  }
  const previousTodoQuery = `select * from todo where id = ${todoId};`;

  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodo = `UPDATE todo SET todo = '${todo}',category = '${category}', priority = '${priority}', status = '${status}',due_date= '${dueDate}' WHERE id = ${todoId}`;
  await db.run(updateTodo);
  response.send(`${updated} Updated`);
});

//API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
