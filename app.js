const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const { format, isValid } = require("date-fns");

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

const priorityList = ["HIGH", "MEDIUM", "LOW"];
const statusList = ["TO%20DO", "TO DO", "IN%20PROGRESS", "DONE"];
const categoryList = ["WORK", "HOME", "LEARNING"];

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

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const convertIntoResponse = (todo) => {
  return {
    id: todo.id,
    todo: todo.todo,
    priority: todo.priority,
    status: todo.status,
    category: todo.category,
    dueDate: todo.due_date,
  };
};

//API 1

app.get("/todos/", async (request, response) => {
  let data = null;
  const { search_q = "", category, priority, status } = request.query;

  switch (true) {
    case hasStatusProperty(request.query):
      if (statusList.find((eachValue) => eachValue === request.query.status)) {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        status = '%${status}%';`;
        const dbStatus = await db.all(getTodosQuery);
        response.send(dbStatus.map(convertIntoResponse));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriorityProperty(request.query):
      if (
        priorityList.find((eachValue) => eachValue === request.query.priority)
      ) {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        priority LIKE '${priority}';`;
        const dbPriority = await db.all(getTodosQuery);
        response.send(dbPriority.map(convertIntoResponse));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasPriorityAndStatusProperties(request.query):
      let isPriority = priorityList.find(
        (eachValue) => eachValue === request.query.priority
      );
      let isStatus = statusList.find(
        (eachValue) => eachValue === request.query.status
      );
      if (isPriority && isStatus) {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        priority = '${priority}'
        AND status = '${status}';`;
        const dbPriorityAndStatus = await db.all(getTodosQuery);
        response.send(dbPriorityAndStatus.map(convertIntoResponse));
      } else {
        if (!isStatus) {
          response.status(400);
          response.send("Invalid Todo Status");
        }
        if (!isPriority) {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      }
      break;
    case hasCategoryAndStatusProperties(request.query):
      let isCategory = categoryList.find(
        (eachValue) => eachValue === request.query.category
      );
      let isStatusValid = statusList.find(
        (eachValue) => eachValue === request.query.status
      );
      if (isCategory && isStatusValid) {
        getTodosQuery = `
        SELECT
          *
        FROM
          todo
        WHERE 
        category = '${category}'
        AND status = '${status}';
        `;
        const dbCategoryAndStatus = await db.all(getTodosQuery);
        response.send(dbCategoryAndStatus.map(convertIntoResponse));
      } else {
        if (!isCategory) {
          response.status(400);
          response.send("Invalid Todo Category");
        }
        if (!isStatusValid) {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      }

      break;
    case hasCategoryAndPriority(request.query):
      let isCategoryValid = categoryList.find(
        (eachValue) => eachValue === request.query.category
      );
      let isPriorityValid = priorityList.find(
        (eachValue) => eachValue === request.query.priority
      );
      if (isCategoryValid && isPriorityValid) {
        getTodosQuery = `
        SELECT
          *
        FROM
          todo
        WHERE 
        category = '${category}'
        AND priority = '${priority}';
        `;
        const dbCategoryAndPriority = await db.all(getTodosQuery);
        response.send(dbCategoryAndPriority.map(convertIntoResponse));
      } else {
        if (!isCategoryValid) {
          response.status(400);
          response.send("Invalid Todo Category");
        }
        if (!isPriorityValid) {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      }

      break;

    case hasCategory(request.query):
      if (
        categoryList.find((eachValue) => eachValue === request.query.category)
      ) {
        getTodosQuery = `
        SELECT
          *
        FROM
          todo
        WHERE 
        category ='${category}';`;
        const dbCategory = await db.all(getTodosQuery);
        response.send(dbCategory.map(convertIntoResponse));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
      const dbData = await db.all(getTodosQuery);
      response.send(dbData.map(convertIntoResponse));
  }
});

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
  const dbTodo = await db.get(getTodoQuery);
  const responseTodo = (todo) => {
    return {
      id: todo.id,
      todo: todo.todo,
      priority: todo.priority,
      status: todo.status,
      category: todo.category,
      dueDate: todo.due_date,
    };
  };
  const result = responseTodo(dbTodo);
  response.send(result);
});

//API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isValid(new Date(date))) {
    const inputDate = format(new Date(date), "yyyy-MM-dd");

    const getTodosQuery = `
    select 
        * 
    from
        todo
    where
        due_date = '${inputDate}';`;

    const listArray = await db.all(getTodosQuery);
    response.send(listArray.map(convertIntoResponse));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  let validateDate = isValid(new Date(dueDate));
  let validatePriority = priorityList.find(
    (eachValue) => eachValue === priority
  );
  let validateStatus = statusList.find((eachValue) => eachValue === status);
  let validateCategory = categoryList.find(
    (eachValue) => eachValue === category
  );

  let dateAndPriority = validateDate && validatePriority;
  let statusAndCategory = validateStatus && validatePriority;
  if (dateAndPriority && statusAndCategory) {
    const postTodoQuery = `
  INSERT INTO
    todo (id, todo,category, priority, status,due_date)
  VALUES
    (${id}, '${todo}', '${category}','${priority}', '${status}','${dueDate}');`;
    await db.run(postTodoQuery);
    response.send("Todo Successfully Added");
  } else {
    if (!validateDate) {
      response.status(400);
      response.send("Invalid Due Date");
    }
    if (!validatePriority) {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
    if (!validateStatus) {
      response.status(400);
      response.send("Invalid Todo Status");
    }
    if (!validateCategory) {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
});

//API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  //let requestBody = request.body;
  //console.log(requestBody.todo);
  const { status, priority, category, todo, dueDate } = request.body;
  //console.log(status);
  let updated = "";
  switch (true) {
    case hasStatusProperty(request.body):
      if (statusList.find((eachValue) => eachValue == request.body.status)) {
        const updateTodoWithStatusQuery = `
        UPDATE todo
        SET status = '${status}'
        WHERE id = ${todoId};`;
        await db.run(updateTodoWithStatusQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case hasPriorityProperty(request.body):
      if (
        priorityList.find((eachValue) => eachValue == request.body.priority)
      ) {
        const updateTodoWithStatusQuery = `
        UPDATE todo
        SET priority = '${priority}'
        WHERE id = ${todoId};`;
        await db.run(updateTodoWithStatusQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case hasCategory(request.body):
      if (
        categoryList.find((eachValue) => eachValue === request.body.category)
      ) {
        const updateTodoWithStatusQuery = `
        UPDATE todo
        SET category = '${category}'
        WHERE id = ${todoId};`;
        await db.run(updateTodoWithStatusQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    case request.body.todo !== undefined:
      const updateTodoWithTodoQuery = `
        UPDATE todo
        SET todo = '${todo}'
        WHERE id = ${todoId};`;
      await db.run(updateTodoWithTodoQuery);
      response.send("Todo Updated");

      break;
    default:
      if (isValid(new Date(request.body.dueDate))) {
        const formatedDate = format(
          new Date(request.body.dueDate),
          "yyyy-MM-dd"
        );
        const updateTodoDuedateQuery = `
                UPDATE todo
                SET due_date = '${formatedDate}'
                WHERE id = ${todoId};`;
        await db.run(updateTodoDuedateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
  }
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

module.exports = app;
