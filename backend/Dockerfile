# Step 1: Specify the base image
FROM node:16-alpine

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json
COPY package*.json ./
COPY yarn*.json ./

# Step 4: Install dependencies
RUN yarn

# Step 5: Copy the rest of your application code
COPY . .

# Step 6 (Optional): Expose port if your app listens on a port
# EXPOSE 3000

# Step 7: Set the command to run your app
# Replace 'app.js' with the path to your main application file
CMD ["node", "index.js"]
