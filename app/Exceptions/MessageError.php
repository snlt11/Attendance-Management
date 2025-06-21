<?php

namespace App\Exceptions;

use Exception;

class MessageError extends Exception
{
    public function render($request)
    {
        return response()->json([
            'message' => $this->message
        ], 422);
    }
}
