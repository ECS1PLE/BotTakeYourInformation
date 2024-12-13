import React, { useState, useEffect } from "react";
import axios from "axios";

interface User {
  id: string;
  firstName: string; // Новые данные
  lastName: string;
  username: string;
  date: string;
  ip: string;
  userAgent: string;
  phoneNumber: string;
}

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    axios
      .get<User[]>("http://localhost:3001/api/users")
      .then((response) => {
        console.log("Данные от API:", response.data);
        setUsers(response.data);
      })
      .catch((error) => {
        console.error("Ошибка при загрузке данных:", error);
        setError("Не удалось загрузить данные.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Загрузка данных...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  return (
    <div style={{ padding: "20px" }} className="container">
      <h1>Панель управления ботом</h1>
      <table
        style={{ width: "100%", textAlign: "left", border: "1px solid black" }}
      >
        <thead>
          <tr>
            <th>ID пользователя</th>
            <th>Имя</th>
            <th>Фамилия</th>
            <th>Имя пользователя</th>
            <th>Номер телефона</th>
            <th>Дата</th>
            <th>IP адрес</th>
            <th>User Agent</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.firstName}</td>
              <td>{user.lastName}</td>
              <td>{user.username}</td>
              <td>{user.phoneNumber}</td>
              <td>
                {user.date
                  ? new Date(user.date).toLocaleDateString()
                  : "Не указано"}
              </td>
              <td>{user.ip}</td>
              <td>{user.userAgent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
