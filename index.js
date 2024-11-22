require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Sirve archivos estáticos

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("Conexión exitosa a MongoDB Atlas"))
    .catch((error) => console.error("Error al conectar a MongoDB:", error));

// Esquema y Modelo de Usuario
const userSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    correo: { type: String, required: true, unique: true },
    contraseña: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

// Ruta de registro
app.post("/register", async (req, res) => {
    const { nombre, correo, contraseña } = req.body;

    try {
        // Verifica si el usuario ya existe
        const existingUser = await User.findOne({ correo });
        if (existingUser) {
            return res.status(400).json({ message: "El correo ya está registrado." });
        }

        // Cifrar la contraseña
        const hashedPassword = await bcrypt.hash(contraseña, 10);

        // Crear el nuevo usuario
        const newUser = new User({ nombre, correo, contraseña: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "Usuario registrado con éxito" });
    } catch (error) {
        res.status(500).json({ message: "Error al registrar usuario", error });
    }
});

// Ruta de login
app.post("/login", async (req, res) => {
    const { correo, contraseña } = req.body;

    try {
        // Buscar usuario por correo
        const user = await User.findOne({ correo });
        if (!user) {
            return res.status(400).json({ message: "Credenciales incorrectas" });
        }

        // Verificar la contraseña
        const isPasswordValid = await bcrypt.compare(contraseña, user.contraseña);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Credenciales incorrectas" });
        }

        res.json({ message: "Inicio de sesión exitoso", user: { nombre: user.nombre, correo: user.correo } });
    } catch (error) {
        res.status(500).json({ message: "Error al iniciar sesión", error });
    }
});

// Ruta para obtener todos los usuarios (CRUD)
app.get("/users", async (req, res) => {
    try {
        const users = await User.find({}, { contraseña: 0 }); // Excluir contraseña al listar
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener usuarios", error });
    }
});

app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;  // Recibe 'name' y 'email' del frontend

  // Creamos un objeto para la actualización con los nombres correctos de los campos
  const updateData = {};

  if (name) updateData.nombre = name;  // Si se envió 'name', se mapea a 'nombre'
  if (email) updateData.correo = email;  // Si se envió 'email', se mapea a 'correo'

  try {
      // Actualiza el usuario con los campos correctos
      const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
      console.log('Usuario actualizado:', updatedUser);
      res.json(updatedUser);  // Devuelve el usuario actualizado
  } catch (error) {
      console.error("Error al actualizar:", error);
      res.status(400).json({ message: "Error al actualizar usuario", error });
  }
});



app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
      await User.findByIdAndDelete(id);
      res.json({ message: "Usuario eliminado con éxito" });
  } catch (error) {
      res.status(400).json({ message: "Error al eliminar usuario", error });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
