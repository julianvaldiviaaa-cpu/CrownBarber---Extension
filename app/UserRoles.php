<?php

namespace App;

enum UserRoles: string
{
    case User = 'user';
    case Worker = 'worker';
    case Admin = 'admin';
}
