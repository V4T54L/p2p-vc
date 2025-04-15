export type authResponse = {
    token?: string,
    error?: string,
}

export type sendAnswerPayload = {
    offer: string
    senderUsername: string
}

export type connectPeerPayload = {
    answer: string
    senderUsername: string
}

