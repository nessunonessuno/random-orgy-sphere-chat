mod database{
    pub mod db;
    pub mod models;
}
mod socket{
    pub mod handler;
}

use std::{ net::SocketAddr, sync::Arc };
use axum::{ routing::{get}, Router };
use tower_http::cors::CorsLayer;
use mongodb::Database;
use crate::database::db;

pub struct AppState {
    db: Arc<Database>
}

#[tokio::main]
async fn main() {
    let db = db::connect_database().await.unwrap();
    let state = Arc::new(AppState {
        db,
    });

    let api = Router::new()
        .route("/ws", get(socket::handler::handler))
        .layer(CorsLayer::very_permissive())
        .with_state(state);

    axum::Server::bind(&"0.0.0.0:1234".parse().unwrap())
        .serve(api.into_make_service_with_connect_info::<SocketAddr>())
        .await
        .unwrap();
}