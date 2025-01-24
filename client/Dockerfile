FROM node:18

RUN npm install -g vite

RUN mkdir /frontend

WORKDIR /frontend

COPY package.json /frontend/package.json

RUN npm install

COPY . .

EXPOSE 5173
CMD [ "npm", "run", "dev" ]