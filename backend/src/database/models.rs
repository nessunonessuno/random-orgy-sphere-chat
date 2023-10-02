use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
#[derive(Debug)]
pub struct Message {
	pub username: String,
	pub ip: String,
    pub message: String,
    pub date: u64, 
}