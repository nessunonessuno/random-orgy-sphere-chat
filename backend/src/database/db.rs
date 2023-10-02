use serde::Serialize;
use futures::TryStreamExt;
use mongodb::options::FindOptions;

use mongodb::Database;
use mongodb::{
    options::{ClientOptions, ResolverConfig},
    Client,
};
use std::sync::Arc;
use dotenv::dotenv;
use crate::database::models::Message;
use mongodb::bson::doc;

#[derive(Serialize, Debug)]
pub struct CleanedMessage {
    message: String,
    username: String
}

pub async fn connect_database() -> Result<Arc<Database>, Box<dyn std::error::Error>> {
    dotenv().ok();
    let client_uri =
        std::env::var("MONGODB_URI").expect("You must set the MONGODB_URI environment var!");
    let options =
        ClientOptions::parse_with_resolver_config(&client_uri, ResolverConfig::cloudflare())
            .await?;
    let client = Client::with_options(options)?;
    let db = client.database("chat");
    Ok(Arc::new(db))
}

pub async fn write_msg_to_db(db: Arc<Database>, message: Message) -> Result<bool, bool>{
    let message_collection = db.collection::<Message>("messages");
    match message_collection.insert_one(message, None).await{
        Ok(_) => Ok(true),
        Err(_)=> {Err(false)}
    }}

pub async fn return_messages(db: Arc<Database>) -> Result<Vec<CleanedMessage>, String>{
    let message_collection = db.collection::<Message>("messages");
    let options = FindOptions::builder()
        .sort(doc! { "timestamp": -1 })
        .limit(10000)
        .build();

    let cursor = message_collection.find(None, options).await;
    match cursor {
        Ok(mut messages) => {
            let mut response: Vec<CleanedMessage> = Vec::new();
            while let Some(raw_message) = messages.try_next().await.unwrap() {
                let cleaned_message = CleanedMessage {
                    message: raw_message.message,
                    username: raw_message.username
                };
                response.push(cleaned_message);
            }
            Ok(response)
        },
        _ => {Err("cock".to_string())}
    }

}