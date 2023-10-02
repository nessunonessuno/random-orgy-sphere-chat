use chrono::Utc;
use crate::db::write_msg_to_db;
use axum::extract::ConnectInfo;
use crate::SocketAddr;
use crate::database::models::Message;
use serde::{Deserialize, Serialize};
use serde_json::json;
use axum::extract::{State, WebSocketUpgrade, ws::WebSocket};
use axum::response::Response;
use crate::{AppState, Arc, Database};
use mongodb::bson::doc;
use crate::database::db::return_messages;

#[derive(Serialize, Deserialize, Debug)]
pub struct IncomingMessage {
    pub option: u64,
    pub payload: Option<MessagePayload>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct MessagePayload {
    pub username: String,
    pub message: String
}

pub async fn handler(ws: WebSocketUpgrade, State(stato): State<Arc<AppState>>, ConnectInfo(addr): ConnectInfo<SocketAddr>) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, addr, stato.db.clone()))
}

async fn handle_socket(mut socket: WebSocket, addr: SocketAddr, db: Arc<Database>) {
    while let Some(result) = socket.recv().await {
        match result {
            Ok(msg) => {
                let text = msg.to_text().unwrap_or_default();
                let incoming: Result<IncomingMessage, _> = serde_json::from_str(&text);
                match incoming {
                    Ok(data) => {
                        match data.option {
                            0 => {
                                match return_messages(Arc::clone(&db)).await {
                                    Ok(messages) =>{
                                        socket.send(json!({"messages": messages}).to_string().into()).await.unwrap();
                                    },
                                    _ => {}
                                }

                            },
                            1 => {
                                if let Some(payload) = data.payload {
                                    if payload.message != ""{
                                        let new_message = Message{
                                            username: payload.username,
                                            message: payload.message,
                                            ip: format!("{:?}" ,addr),
                                            date: Utc::now().timestamp() as u64
                                        };
                                        let _ = write_msg_to_db(Arc::clone(&db), new_message).await;
                                        match return_messages(Arc::clone(&db)).await {
                                            Ok(messages) =>{
                                                socket.send(json!({"messages": messages}).to_string().into()).await.unwrap();
                                            },
                                            _ => {}
                                        }
                                    }
                                }
                            },
                            _ => {}
                        }
                    },
                    Err(_) => {}
                }
            },
            Err(_) => continue,
        }
    }
}
