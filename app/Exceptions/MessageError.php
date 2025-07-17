<?php

namespace App\Exceptions;

use Exception;

class MessageError extends Exception
{
    protected $status;

    public function __construct($message = '', $status = 422)
    {
        parent::__construct($message);
        $this->status = $status;
    }

    public function render($request)
    {
        return response()->json([
            'message' => $this->message
        ], $this->status);
    }
}
